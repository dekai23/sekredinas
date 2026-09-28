<#
.SYNOPSIS
  Ekstraksi data master BKPSDM Kabupaten Yahukimo dari dokumen sumber menjadi
  berkas JSON siap dipakai sebagai seed data aplikasi (tidak bergantung stack).

.DESCRIPTION
  Masukan : DATA PEGAWAI.xlsx, STRUKTUR.docx
  Keluaran: seed/pegawai.json             -> pegawai + unit kerja + usulan role
            seed/struktur-organisasi.json -> hierarki unit + kode + pejabat
            seed/catatan-konfirmasi.json  -> hal yang perlu dipastikan ke instansi

  Berkas .xlsx/.docx dibaca sebagai arsip ZIP (OOXML) sehingga tidak memerlukan
  Microsoft Office. Berkas disalin ke TEMP lebih dulu agar tetap terbaca
  walaupun sedang dibuka di Word/Excel (file lock).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\tools\extract-seed.ps1
#>
[CmdletBinding()]
param([string]$Root = '')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ([string]::IsNullOrWhiteSpace($Root)) {
  $scriptDir = if ($PSScriptRoot) { $PSScriptRoot }
  elseif ($MyInvocation.MyCommand.Path) { Split-Path -Parent $MyInvocation.MyCommand.Path }
  else { (Get-Location).ProviderPath }
  $Root = (Resolve-Path (Join-Path $scriptDir '..')).Path
}

# ------------------------------------------------- identitas & kamus kode unit
$script:NamaBadan = 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo'
$script:PolaBadan = '(?i),?\s*Badan Kepegawaian (?:Dan|dan) Pengembangan Sumber Daya Manusia Kabupaten Yahukimo\.?\s*$'
$script:DomainEmail = 'yahukimokab.go.id'
$script:EmailKantor = 'bkpsdm@yahukimokab.go.id'

$script:KodeUnit = @{
  'Sekretariat'                                                       = 'SEK'
  'Bidang Mutasi, Promosi dan Penilaian Kinerja Aparatur'              = 'MPP'
  'Bidang Pengadaan, Pemberhentian dan Informasi'                      = 'PPI'
  'Bidang Pengembangan Aparatur'                                       = 'PA'
  'Kelompok Jabatan Fungsional'                                        = 'FUNGS'
  'Sub Bagian Umum dan Kepegawaian'                                    = 'SEK-UK'
  'Sub Bagian Perencanaan dan Keuangan'                                = 'SEK-PK'
  'Sub Bidang Pengembangan Kompetensi'                                 = 'PA-01'
  'Sub Bidang Diklat Penjenjangan, Sertifikasi dan Teknis Fungsional'   = 'PA-02'
  'Sub Bidang Kepangkatan'                                             = 'MPP-01'
  'Sub Bidang Mutasi, Pengembangan Karier dan Promosi'                 = 'MPP-02'
  'Sub Bidang Penilaian Kinerja Aparatur, Disiplin dan Penghargaan'    = 'MPP-03'
  'Sub Bidang Pengadaan dan Pemberhentian'                             = 'PPI-01'
  'Sub Bidang Fasilitasi dan Profesi ASN'                              = 'PPI-02'
  'Sub Bidang Data dan Informasi'                                      = 'PPI-03'
}

# variasi penulisan pada dokumen sumber -> nama unit baku
$script:AliasUnit = @{
  'subbidangfasilitasiprofesiasn' = 'Sub Bidang Fasilitasi dan Profesi ASN'
}

# penetapan role khusus di luar pola jabatan (NIP -> role)
$script:PetaRole = @{
  '197908132015091001' = 'admin'   # Theodorus Valentinus, S.Kom. - Admin Sistem
}

# ------------------------------------------------------------------- FUNGSI ---
function Get-ZipEntryText {
  param([string]$ZipPath, [string]$EntryName)
  $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq $EntryName }
    if (-not $entry) { return $null }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
  }
  finally { $zip.Dispose() }
}

function Copy-ToTemp {
  param([string]$SourcePath)
  $tmp = Join-Path $env:TEMP ('seed_' + [System.IO.Path]::GetFileName($SourcePath))
  Copy-Item -LiteralPath $SourcePath -Destination $tmp -Force
  return $tmp
}

function Get-SharedStrings {
  param([string]$ZipPath)
  $xml = Get-ZipEntryText -ZipPath $ZipPath -EntryName 'xl/sharedStrings.xml'
  if (-not $xml) { return @() }
  $items = @()
  $xml = $xml -replace '<t/>', '<t></t>'
  $items = @()
  foreach ($si in [regex]::Matches($xml, '<si>(.*?)</si>', 'Singleline')) {
    $text = ''
    foreach ($t in [regex]::Matches($si.Groups[1].Value, '<t[^>]*>(.*?)</t>', 'Singleline')) {
      $text += [System.Net.WebUtility]::HtmlDecode($t.Groups[1].Value)
    }
    $items += $text
  }
  return $items
}

function Get-SheetRows {
  param([string]$ZipPath, [string]$SheetPath, [string[]]$SharedStrings)
  $xml = Get-ZipEntryText -ZipPath $ZipPath -EntryName $SheetPath
  if (-not $xml) { throw "Lembar kerja '$SheetPath' tidak ditemukan." }
  $hasil = @()
  foreach ($row in [regex]::Matches($xml, '<row([^>]*)>(.*?)</row>', 'Singleline')) {
    $nomor = [regex]::Match($row.Groups[1].Value, 'r="(\d+)"').Groups[1].Value
    $cells = @{}
    foreach ($cell in [regex]::Matches($row.Groups[2].Value, '<c\s+([^>]*?)(?:/>|>(.*?)</c>)', 'Singleline')) {
      $attrs = $cell.Groups[1].Value
      $col = [regex]::Match($attrs, 'r="([A-Z]+)\d+"').Groups[1].Value
      $tipe = [regex]::Match($attrs, 't="(\w+)"').Groups[1].Value
      if (-not $col) { continue }
      $nilai = $null
      if ($tipe -eq 'inlineStr') {
        foreach ($t in [regex]::Matches($cell.Groups[2].Value, '<t[^>]*>(.*?)</t>', 'Singleline')) {
          $nilai += [System.Net.WebUtility]::HtmlDecode($t.Groups[1].Value)
        }
      }
      else {
        $vm = [regex]::Match($cell.Groups[2].Value, '<v>(.*?)</v>', 'Singleline')
        if ($vm.Success) {
          $nilai = [System.Net.WebUtility]::HtmlDecode($vm.Groups[1].Value)
          if ($tipe -eq 's') { $nilai = $SharedStrings[[int]$nilai] }
        }
      }
      if (-not [string]::IsNullOrWhiteSpace($nilai)) { $cells[$col] = $nilai.Trim() }
    }
    $hasil += [pscustomobject]@{ Row = [int]$nomor; Cells = $cells }
  }
  return $hasil
}

function Get-NamaRapi {
  param([string]$Teks)
  if ([string]::IsNullOrWhiteSpace($Teks)) { return $null }
  $t = ($Teks -replace '\s+', ' ').Trim().TrimEnd(',', '.').Trim()
  $t = $t -replace '\bDan\b', 'dan'
  $t = $t -replace '\bPada\b', 'pada'
  $t = $t -replace '\bASN\b', 'ASN'
  return $t
}

function Get-KunciBanding {
  param([string]$Teks)
  if ([string]::IsNullOrWhiteSpace($Teks)) { return '' }
  return (($Teks.ToUpper() -replace '[^A-Z0-9]', ''))
}

function Get-KataKunci {
  param([string]$Teks)
  if ([string]::IsNullOrWhiteSpace($Teks)) { return @() }
  $abaikan = @('DAN', 'DI', 'KE', 'PADA', 'YANG', 'UNTUK', 'THE')
  $kata = @($Teks.ToUpper() -replace '[^A-Z0-9]', ' ' -split '\s+' |
      Where-Object { $_ -and $abaikan -notcontains $_ } |
      Sort-Object -Unique)
  return $kata
}

function Get-Kemiripan {
  param([string[]]$A, [string[]]$B)
  if ($A.Count -eq 0 -or $B.Count -eq 0) { return 0 }
  $irisan = @($A | Where-Object { $B -contains $_ })
  $gabungan = @($A + ($B | Where-Object { $A -notcontains $_ }))
  return [math]::Round($irisan.Count / $gabungan.Count, 3)
}

function Get-NamaUnitBaku {
  param([string]$Nama)
  if ([string]::IsNullOrWhiteSpace($Nama)) { return $null }
  $kunci = ($Nama -replace '[^A-Za-z0-9]', '').ToLower()
  if ($script:AliasUnit.ContainsKey($kunci)) { return $script:AliasUnit[$kunci] }
  return $Nama
}

function Get-UsulanEmail {
  param([string]$Nama)
  if ([string]::IsNullOrWhiteSpace($Nama)) { return $null }
  $tanpaGelar = ($Nama -split ',')[0].Trim()
  $slug = ($tanpaGelar.ToLower() -replace '[^a-z0-9]+', '.').Trim('.')
  if (-not $slug) { return $null }
  return ('{0}@{1}' -f $slug, $script:DomainEmail)
}
function Get-Akronim {
  param([string]$Nama, [int]$Maks = 4)
  $inti = ($Nama -replace '^(Sub Bidang|Sub Bagian|Bidang)\s+', '')
  $skip = @('dan', 'di', 'ke', 'pada', 'yang', 'untuk')
  $kata = @($inti -split '[\s,\.]+' | Where-Object { $_ -and $skip -notcontains $_.ToLower() })
  $kode = ($kata | ForEach-Object { $_.Substring(0, 1).ToUpper() }) -join ''
  if ($kode.Length -gt $Maks) { $kode = $kode.Substring(0, $Maks) }
  return $kode
}

function Get-UnitInfo {
  param([string]$Jabatan)
  $hasil = [ordered]@{
    peran      = 'lainnya'
    unitKerja  = $null
    jenisUnit  = $null
    indukUnit  = $null
    usulanRole = 'pegawai'
  }
  if ([string]::IsNullOrWhiteSpace($Jabatan)) { return [pscustomobject]$hasil }

  $bersih = Get-NamaRapi $Jabatan
  $bagian = @($bersih -split '\s+pada\s+')
  $posisi = $bagian[0].Trim()

  switch -Regex ($posisi) {
    '^((?:Pl|Plt)\.)\s*Kepala'                     { $hasil.peran = 'plt' }
    '^(Pelaksana|PELAKSANA)'                       { $hasil.peran = 'pelaksana' }
    '^Kepala Bidang'                               { $hasil.peran = 'kepala_bidang' }
    '^Kepala Sub Bidang'                           { $hasil.peran = 'kepala_sub_bidang' }
    '^Kepala Sub Bagian'                           { $hasil.peran = 'kepala_sub_bagian' }
    '^Sekretaris'                                  { $hasil.peran = 'sekretaris' }
    '^(Analis|Pranata|Penyuluh|Perencana|Auditor)' { $hasil.peran = 'fungsional' }
    default                                        { $hasil.peran = 'lainnya' }
  }

  # --- unit kerja
  if ($posisi -match '^((?:Pl|Plt)\.\s*)?Kepala\s+(Sub Bidang|Sub Bagian)\s+(.+)$') {
    $hasil.unitKerja = Get-NamaRapi "$($Matches[2]) $($Matches[3])"
  }
  elseif ($posisi -match '^((?:Pl|Plt)\.\s*)?Kepala\s+Bidang\s+(.+)$') {
    $hasil.unitKerja = Get-NamaRapi "Bidang $($Matches[2])"
  }
  elseif ($posisi -match '^Sekretaris') {
    $hasil.unitKerja = 'Sekretariat'
  }
  elseif ($bagian.Count -ge 2 -and $bagian[1] -match '^(Sub Bidang|Sub Bagian|Bidang)') {
    $hasil.unitKerja = Get-NamaRapi $bagian[1]
  }

  # --- induk unit
  if ($bagian.Count -ge 2) {
    $kandidat = Get-NamaRapi ($bagian[-1] -replace $script:PolaBadan, '')
    if ($kandidat -and $kandidat -match '^(Sub Bidang|Sub Bagian)') {
      # bentuk "Pelaksana pada Sub Bidang A Pada Bidang B"
      if ($bagian.Count -ge 3) {
        $kandidat = Get-NamaRapi ($bagian[-1] -replace $script:PolaBadan, '')
      }
      else { $kandidat = $null }
    }
    $hasil.indukUnit = if ($kandidat) { $kandidat } else { $script:NamaBadan }
  }
  elseif ($hasil.peran -in @('kepala_bidang', 'sekretaris')) {
    $hasil.indukUnit = $script:NamaBadan
  }

  # --- jenis unit + koreksi induk baku
  if ($hasil.unitKerja -eq 'Sekretariat') {
    $hasil.jenisUnit = 'sekretariat'
    $hasil.indukUnit = $script:NamaBadan
  }
  elseif ($hasil.unitKerja -match '^Sub Bagian') {
    $hasil.jenisUnit = 'sub_bagian'
    $hasil.indukUnit = 'Sekretariat'
  }
  elseif ($hasil.unitKerja -match '^Sub Bidang') {
    $hasil.jenisUnit = 'sub_bidang'
  }
  elseif ($hasil.unitKerja -match '^Bidang') {
    $hasil.jenisUnit = 'bidang'
    $hasil.indukUnit = $script:NamaBadan
  }
  elseif ($hasil.peran -eq 'fungsional') {
    # jabatan fungsional secara struktur dibawahi langsung oleh Kepala Badan
    $hasil.unitKerja = 'Kelompok Jabatan Fungsional'
    $hasil.jenisUnit = 'kelompok_fungsional'
    $hasil.indukUnit = $script:NamaBadan
  }

  $hasil.unitKerja = Get-NamaUnitBaku $hasil.unitKerja

  if ($hasil.peran -in @('kepala_bidang', 'kepala_sub_bidang', 'kepala_sub_bagian', 'sekretaris')) {
    $hasil.usulanRole = 'pimpinan'
  }

  return [pscustomobject]$hasil
}
# ------------------------------------------------------- 1. BACA DATA PEGAWAI
$berkasPegawai = Join-Path $Root 'DATA PEGAWAI.xlsx'
if (-not (Test-Path -LiteralPath $berkasPegawai)) { throw "Berkas tidak ditemukan: $berkasPegawai" }

$tempPegawai = Copy-ToTemp -SourcePath $berkasPegawai
$sharedStrings = Get-SharedStrings -ZipPath $tempPegawai
$baris = Get-SheetRows -ZipPath $tempPegawai -SheetPath 'xl/worksheets/sheet1.xml' -SharedStrings $sharedStrings

$barisHeader = $baris | Where-Object { $_.Cells.Values -contains 'NIP' } | Select-Object -First 1
if (-not $barisHeader) { throw 'Baris header (kolom NIP) tidak ditemukan pada DATA PEGAWAI.xlsx' }

$pegawai = @()
foreach ($barisData in ($baris | Where-Object { $_.Row -gt $barisHeader.Row })) {
  $nip = $barisData.Cells['B']
  if (-not $nip) { continue }

  $jabatan = Get-NamaRapi $barisData.Cells['F']
  $unit = Get-UnitInfo -Jabatan $jabatan
  $pangkatGolongan = $barisData.Cells['D']
  $ruang = [regex]::Match($pangkatGolongan, '[\(\{]([^\)\}]+)[\)\}]').Groups[1].Value
  $eselon = $barisData.Cells['G']
  $roleUsulan = $unit.usulanRole
  if ($script:PetaRole.ContainsKey($nip)) { $roleUsulan = $script:PetaRole[$nip] }

  $pegawai += [pscustomobject][ordered]@{
    no              = if ($barisData.Cells['A']) { [int]$barisData.Cells['A'] } else { $null }
    nip             = $nip
    nama            = $barisData.Cells['C']
    pangkatGolongan = $pangkatGolongan
    pangkat         = ($pangkatGolongan -replace '\s*\(.*\)\s*$', '').Trim()
    golongan        = $ruang
    jenisJabatan    = $barisData.Cells['E']
    jabatan         = $jabatan
    eselon          = $eselon
    eselonTingkat   = ($eselon -replace '(?i)^eselon\s*', '').Trim()
    statusPegawai   = $barisData.Cells['H']
    peran           = $unit.peran
    unitKerja       = $unit.unitKerja
    jenisUnit       = $unit.jenisUnit
    indukUnit       = $unit.indukUnit
    usulanRole      = $roleUsulan
    email           = $null
    usulanEmail     = Get-UsulanEmail -Nama $barisData.Cells['C']
    aktif           = $true
  }
}

# -------------------------------------------------- 2. BACA STRUKTUR (DOCX)
$unitDokumen = @()
$berkasStruktur = Join-Path $Root 'STRUKTUR.docx'
if (Test-Path -LiteralPath $berkasStruktur) {
  $tempStruktur = Copy-ToTemp -SourcePath $berkasStruktur
  $docXml = Get-ZipEntryText -ZipPath $tempStruktur -EntryName 'word/document.xml'
  if ($docXml) {
    $teks = $docXml -replace '</w:p>', "`n" -replace '<[^>]+>', ''
    foreach ($line in ($teks -split "`n")) {
      $nama = ($line.Trim() -replace '^\d+', '').Trim()
      if ($nama -match '^(SUB BIDANG|SUB BAGIAN|BIDANG|SEKRETARIAT|KELOMPOK)\b' -and $unitDokumen -notcontains $nama) {
        $unitDokumen += $nama
      }
    }
  }
}
# --------------------------------------------- 3. SUSUN STRUKTUR ORGANISASI
$unitMap = [ordered]@{}
$unitMap[$script:NamaBadan] = [ordered]@{
  nama = $script:NamaBadan; jenis = 'badan'; induk = $null; kode = 'BKD'
  jumlahPegawai = 0; pejabat = @(); namaPadaStrukturDocx = $null; selisihNama = $false
}

foreach ($p in $pegawai) {
  if (-not $p.unitKerja) { continue }
  if (-not $unitMap.Contains($p.unitKerja)) {
    $kodeBaru = if ($script:KodeUnit.ContainsKey($p.unitKerja)) { $script:KodeUnit[$p.unitKerja] } else { Get-Akronim $p.unitKerja }
    $unitMap[$p.unitKerja] = [ordered]@{
      nama = $p.unitKerja; jenis = $p.jenisUnit; induk = $p.indukUnit; kode = $kodeBaru
      jumlahPegawai = 0; pejabat = @(); namaPadaStrukturDocx = $null; selisihNama = $false
    }
  }
  $unitMap[$p.unitKerja].jumlahPegawai++
  if ($p.peran -in @('kepala_bidang', 'kepala_sub_bidang', 'kepala_sub_bagian', 'sekretaris', 'plt')) {
    $unitMap[$p.unitKerja].pejabat += ("{0} ({1})" -f $p.nama, $p.nip)
  }
}

# lengkapi unit induk yang belum terdaftar (mis. Bidang Pengembangan Aparatur)
$ulang = $true
while ($ulang) {
  $ulang = $false
  foreach ($u in @($unitMap.Values)) {
    if (-not $u.induk) { continue }
    if ($unitMap.Contains($u.induk)) { continue }
    $jenisInduk = 'lainnya'
    if ($u.induk -match '^Bidang') { $jenisInduk = 'bidang' }
    elseif ($u.induk -eq 'Sekretariat') { $jenisInduk = 'sekretariat' }
    $indukDariInduk = if ($jenisInduk -in @('bidang', 'sekretariat')) { $script:NamaBadan } else { $null }
    $kodeInduk = if ($script:KodeUnit.ContainsKey($u.induk)) { $script:KodeUnit[$u.induk] } else { Get-Akronim $u.induk }
    $unitMap[$u.induk] = [ordered]@{
      nama = $u.induk; jenis = $jenisInduk; induk = $indukDariInduk; kode = $kodeInduk
      jumlahPegawai = 0; pejabat = @(); namaPadaStrukturDocx = $null; selisihNama = $false
    }
    $ulang = $true
  }
}

# ------------------------------- 4. BANDINGKAN DENGAN STRUKTUR.docx + CATATAN
$catatan = @()
$petaKunci = @{}
foreach ($k in $unitMap.Keys) { $petaKunci[(Get-KunciBanding $k)] = $k }

foreach ($namaDocx in $unitDokumen) {
  $kunci = Get-KunciBanding $namaDocx
  if ($petaKunci.ContainsKey($kunci)) {
    $unitMap[$petaKunci[$kunci]].namaPadaStrukturDocx = $namaDocx
    continue
  }
  # cari unit terdekat memakai kemiripan kata (mis. "FASILITASI DAN PROFESI ASN")
  $kataDocx = Get-KataKunci $namaDocx
  $mirip = $null
  $skorTertinggi = 0
  foreach ($k in $unitMap.Keys) {
    $skor = Get-Kemiripan -A $kataDocx -B (Get-KataKunci $k)
    if ($skor -gt $skorTertinggi) { $skorTertinggi = $skor; $mirip = $k }
  }

  if ($mirip -and $skorTertinggi -ge 0.6) {
    $unitMap[$mirip].namaPadaStrukturDocx = $namaDocx
    $unitMap[$mirip].skorKemiripan = $skorTertinggi
    $unitMap[$mirip].selisihNama = $true
    $catatan += [pscustomobject]@{
      tingkat = 'perlu_konfirmasi'; topik = 'Nama unit berbeda antar dokumen'
      detail  = "'$mirip' (DATA PEGAWAI.xlsx) vs '$namaDocx' (STRUKTUR.docx) - kemiripan $skorTertinggi"
    }
  }
  else {
    $catatan += [pscustomobject]@{
      tingkat = 'perlu_konfirmasi'; topik = 'Unit STRUKTUR.docx tanpa padanan data jabatan'
      detail  = "'$namaDocx' belum ada pada data jabatan pegawai (kemiripan tertinggi $skorTertinggi)"
    }
  }
}

# unit tanpa pejabat/pegawai pada data
$unitKosong = @($unitMap.Values | Where-Object { $_.jenis -ne 'badan' -and $_.jumlahPegawai -eq 0 } | ForEach-Object { $_.nama })
if ($unitKosong.Count -gt 0) {
  $catatan += [pscustomobject]@{
    tingkat = 'perlu_konfirmasi'; topik = 'Unit belum punya pegawai pada data'
    detail  = ($unitKosong -join ' | ')
  }
}

# unit dengan induk berbeda antar pegawai
$petaInduk = @{}
foreach ($p in $pegawai) {
  if (-not $p.unitKerja -or -not $p.indukUnit) { continue }
  if (-not $petaInduk.ContainsKey($p.unitKerja)) { $petaInduk[$p.unitKerja] = @() }
  if ($petaInduk[$p.unitKerja] -notcontains $p.indukUnit) { $petaInduk[$p.unitKerja] += $p.indukUnit }
}
foreach ($k in $petaInduk.Keys) {
  if ($petaInduk[$k].Count -gt 1) {
    $catatan += [pscustomobject]@{
      tingkat = 'penting'; topik = 'Unit tercatat di bawah dua induk berbeda'
      detail  = "'$k' -> $($petaInduk[$k] -join ' | ')"
    }
  }
}

# --- validasi aturan instansi: pelaksana hanya pada jabatan eselon terendah
foreach ($p in ($pegawai | Where-Object { $_.peran -in @('pelaksana', 'lainnya') })) {
  if (-not $p.unitKerja) {
    $catatan += [pscustomobject]@{
      tingkat = 'pelanggaran_aturan'; topik = 'Pelaksana belum punya unit kerja'
      detail  = "$($p.nama) ($($p.nip)) belum ditempatkan pada Sub Bidang/Sub Bagian."
    }
  }
  elseif ($p.jenisUnit -in @('bidang', 'sekretariat')) {
    $catatan += [pscustomobject]@{
      tingkat = 'pelanggaran_aturan'; topik = 'Pelaksana langsung di bawah Bidang/Sekretariat'
      detail  = "$($p.nama) ($($p.nip)) tercatat pada '$($p.unitKerja)'; pelaksana hanya boleh pada jabatan eselon terendah (Sub Bidang/Sub Bagian)."
    }
  }
}

# --- unit yang hanya dijabat Pl./Plt. (tanpa pejabat definitif)
foreach ($u in $unitMap.Values) {
  if ($u.jenis -eq 'badan') { continue }
  $definitif = @($pegawai | Where-Object {
      $_.unitKerja -eq $u.nama -and $_.peran -in @('kepala_bidang', 'kepala_sub_bidang', 'kepala_sub_bagian', 'sekretaris')
    })
  if ($u.pejabat.Count -gt 0 -and $definitif.Count -eq 0) {
    $catatan += [pscustomobject]@{
      tingkat = 'perlu_konfirmasi'; topik = 'Unit tanpa pejabat definitif'
      detail  = "$($u.nama) untuk sementara hanya dijabat Pl./Plt.: $($u.pejabat -join ', ')"
    }
  }
}

$catatan += @(
  [pscustomobject]@{ tingkat = 'penting'; topik = 'Kepala Badan belum ada pada data pegawai'
    detail = 'DATA PEGAWAI.xlsx memuat Sekretaris (Eselon III.a) tetapi belum memuat Kepala Badan; akun pimpinan tertinggi perlu ditambahkan.' }
  [pscustomobject]@{ tingkat = 'selesai'; topik = 'Admin Sistem ditetapkan'
    detail = 'Theodorus Valentinus, S.Kom. (NIP 197908132015091001) ditetapkan sebagai Admin Sistem dan diberi role admin.' }
  [pscustomobject]@{ tingkat = 'perlu_konfirmasi'; topik = 'Penulisan resmi nama Sub Bidang Fasilitasi dan Profesi ASN'
    detail = 'Ada tiga variasi: "Sub Bidang Fasilitasi dan Profesi ASN" (STRUKTUR.docx terbaru), "Sub Bidang Fasilitasi Profesi ASN" (DATA PEGAWAI.xlsx), dan "Fasilitas dan Profesi ASN" (keterangan lisan). Mohon dipastikan penulisan resmi menurut nomenklatur.' }
  [pscustomobject]@{ tingkat = 'perlu_konfirmasi'; topik = 'Nama Sub Bidang Penilaian Kinerja Aparatur'
    detail = 'DATA PEGAWAI.xlsx menulis "Sub Bidang Penilaian Kinerja Aparatur, Disiplin dan Penghargaan", STRUKTUR.docx menulis "Sub Bidang Penilaian Kinerja Aparatur".' }
  [pscustomobject]@{ tingkat = 'perlu_konfirmasi'; topik = 'Kewenangan Pl./Plt. pada aplikasi'
    detail = 'PENIUS SIEP, S.E. (Pl.) dan TINUS BAHABOL, S.Pd. (Plt.) ber-eselon NON ESELON; usulan role saat ini "pegawai". Bila diberi kewenangan disposisi/persetujuan, role diubah menjadi "pimpinan".' }
  [pscustomobject]@{ tingkat = 'perlu_konfirmasi'; topik = 'Pola email dan login pegawai'
    detail = 'Domain instansi yahukimokab.go.id (email kantor bkpsdm@yahukimokab.go.id). Usulan email pegawai memakai pola nama.tanpa.gelar@yahukimokab.go.id; alternatifnya login memakai NIP - mohon dipilih.' }
  [pscustomobject]@{ tingkat = 'info'; topik = 'Jabatan fungsional pada Kelompok Jabatan Fungsional'
    detail = 'Analis SDM Aparatur Ahli Pertama dan Pranata SDM Aparatur Terampil dipetakan ke unit "Kelompok Jabatan Fungsional" yang dibawahi langsung Kepala Badan.' }
  [pscustomobject]@{ tingkat = 'info'; topik = 'Kolom tautan eksternal pada Excel'
    detail = 'DATA PEGAWAI.xlsx masih menautkan 4 workbook luar (AGAMA, DATA PNS per 30 Agustus 2026, Jabatan, PANGKAT); sertakan berkasnya bila data tersebut diperlukan.' }
)
# --------------------------------------------------------------- 5. TULIS FILE
$seedDir = Join-Path $Root 'seed'
New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Save-JsonFile {
  param([string]$Path, $Data)
  [System.IO.File]::WriteAllText($Path, ($Data | ConvertTo-Json -Depth 6), $utf8)
}

$pathPegawai = Join-Path $seedDir 'pegawai.json'
Save-JsonFile -Path $pathPegawai -Data ([pscustomobject][ordered]@{
    instansi    = 'BKPSDM Kabupaten Yahukimo'
    sumber      = 'DATA PEGAWAI.xlsx / Lembar1'
    kolomSumber = 'A=No., B=NIP, C=NAMA, D=GOLONGA, E=JENIS JABATAN, F=JABATAN, G=ESELON, H=STATUS PEGAWAI'
    jumlah      = $pegawai.Count
    pegawai     = $pegawai
  })

$pathStruktur = Join-Path $seedDir 'struktur-organisasi.json'
Save-JsonFile -Path $pathStruktur -Data ([pscustomobject][ordered]@{
    instansi = 'BKPSDM Kabupaten Yahukimo'
    sumber   = 'DATA PEGAWAI.xlsx (kolom JABATAN) + STRUKTUR.docx'
    jumlah   = $unitMap.Count
    unit     = @($unitMap.Values)
  })

$pathCatatan = Join-Path $seedDir 'catatan-konfirmasi.json'
Save-JsonFile -Path $pathCatatan -Data ([pscustomobject][ordered]@{
    instansi = 'BKPSDM Kabupaten Yahukimo'
    jumlah   = $catatan.Count
    catatan  = $catatan
  })

$pathInstansi = Join-Path $seedDir 'instansi.json'
Save-JsonFile -Path $pathInstansi -Data ([pscustomobject][ordered]@{
    namaBadan    = $script:NamaBadan
    namaSingkat  = 'BKPSDM Kabupaten Yahukimo'
    pemerintah   = 'Pemerintah Kabupaten Yahukimo'
    alamat       = 'Komp. Gedung Serba Guna Jl. Kurima - Dekai'
    emailKantor  = $script:EmailKantor
    domainEmail  = $script:DomainEmail
    logo         = 'LOGO Yahukimo2.png'
    ukuranKertas = 'F4 (21,6 x 33 cm)'
    garisKop     = 'garis ganda (thin-thick) 1,5 pt'
    zonaWaktu    = 'Asia/Jayapura (WIT)'
    adminSistem  = 'Theodorus Valentinus, S.Kom. (NIP 197908132015091001)'
    sumber       = 'kop bkd.docx, STRUKTUR.docx, DATA PEGAWAI.xlsx, keterangan instansi'
  })

# ----------------------------------------------------------------- 6. RINGKASAN
Write-Host ''
Write-Host '=== EKSTRAKSI DATA MASTER BKPSDM KABUPATEN YAHUKIMO ==='
Write-Host ('Pegawai            : {0}' -f $pegawai.Count)
Write-Host ('Unit organisasi    : {0}' -f $unitMap.Count)
Write-Host ('Catatan konfirmasi : {0}' -f $catatan.Count)
Write-Host ''
Write-Host '--- Unit organisasi ---'
foreach ($u in $unitMap.Values) {
  $indukTeks = if ($u.induk) { $u.induk } else { '-' }
  $tanda = if ($u.selisihNama) { ' [nama beda dgn STRUKTUR.docx]' } else { '' }
  Write-Host ('  {0,-8} {1} | induk: {2} | pegawai: {3}{4}' -f $u.kode, $u.nama, $indukTeks, $u.jumlahPegawai, $tanda)
}
Write-Host ''
Write-Host '--- Catatan yang perlu dikonfirmasi ke instansi ---'
$i = 1
foreach ($c in $catatan) {
  Write-Host ('  {0}. [{1}] {2}' -f $i, $c.tingkat, $c.topik)
  Write-Host ('     {0}' -f $c.detail)
  $i++
}
Write-Host ''
Write-Host ('Berkas keluaran: {0}' -f $seedDir)
