Add-Type -AssemblyName System.Drawing
function Crop-ToBounds($path, $minX, $minY, $maxX, $maxY, $pad) {
    $bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $path))
    $w = $bmp.Width; $h = $bmp.Height
    $x0 = [Math]::Max(0, $minX - $pad)
    $y0 = [Math]::Max(0, $minY - $pad)
    $x1 = [Math]::Min($w, $maxX + $pad)
    $y1 = [Math]::Min($h, $maxY + $pad)
    $cw = $x1 - $x0
    $ch = $y1 - $y0
    $rect = New-Object System.Drawing.Rectangle($x0, $y0, $cw, $ch)
    $cropped = New-Object System.Drawing.Bitmap($cw, $ch)
    $cropped.SetResolution($bmp.HorizontalResolution, $bmp.VerticalResolution)
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0,0,$cw,$ch)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $bmp.Dispose()
    $full = (Resolve-Path $path).Path
    $cropped.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "$path cropped to ${cw}x${ch}"
}
Crop-ToBounds "public\favicon.png" 248 340 736 668 20
Crop-ToBounds "public\tidalWave.png" 48 234 906 768 15
