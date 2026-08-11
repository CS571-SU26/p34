Add-Type -AssemblyName System.Drawing
function Get-ContentBounds($path) {
    $bmp = [System.Drawing.Bitmap]::FromFile($path)
    $w = $bmp.Width; $h = $bmp.Height
    $minX=$w; $minY=$h; $maxX=0; $maxY=0
    for ($y=0; $y -lt $h; $y+=2) {
        for ($x=0; $x -lt $w; $x+=2) {
            $p = $bmp.GetPixel($x,$y)
            $isBg = ($p.A -lt 10) -or ($p.A -gt 0 -and $p.R -gt 250 -and $p.G -gt 250 -and $p.B -gt 250)
            if (-not $isBg) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $bmp.Dispose()
    Write-Output "$path bounds: x[$minX,$maxX] y[$minY,$maxY] of $w x $h"
}
Get-ContentBounds "public\favicon.png"
Get-ContentBounds "public\tidalWave.png"
