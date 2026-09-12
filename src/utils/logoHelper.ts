/**
 * Helper utility untuk pembuatan, pemrosesan, dan konversi logo perusahaan format PNG.
 */

// Elegant default PNG logo generator (creates a crisp 256x256 transparent PNG Data URL)
export function createDefaultCompanyLogoPNG(companyName: string = 'PT BERKAH ALAM MULIA'): string {
  if (typeof document === 'undefined') {
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Clear transparent background
    ctx.clearRect(0, 0, 256, 256);

    // Draw modern geometric quarry/mountain shield
    // Background gradient circle/shield
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#1e3a8a'); // deep blue
    grad.addColorStop(1, '#0f172a'); // slate 900

    ctx.beginPath();
    ctx.roundRect(16, 16, 224, 224, 48);
    ctx.fillStyle = grad;
    ctx.fill();

    // Gold accent border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Mountain / Quarry layer 1 (slate / stone)
    ctx.beginPath();
    ctx.moveTo(40, 180);
    ctx.lineTo(95, 90);
    ctx.lineTo(150, 180);
    ctx.closePath();
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // Mountain / Quarry layer 2 (gold / amber apex)
    ctx.beginPath();
    ctx.moveTo(105, 180);
    ctx.lineTo(160, 70);
    ctx.lineTo(215, 180);
    ctx.closePath();
    ctx.fillStyle = '#d97706';
    ctx.fill();

    // Foreground Mountain Peak (high-contrast white/blue)
    ctx.beginPath();
    ctx.moveTo(70, 180);
    ctx.lineTo(128, 105);
    ctx.lineTo(186, 180);
    ctx.closePath();
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Bottom banner bar
    ctx.beginPath();
    ctx.roundRect(32, 190, 192, 34, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Monogram text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BAM MATERIAL', 128, 207);

    // Return pure .png Data URL
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

/**
 * Membaca file gambar yang diunggah pengguna, mengubah ukurannya ke dimensi proporsional (maks 400x400),
 * dan mengonversinya menjadi data URL format PNG transparan berkualitas tinggi.
 */
export function processImageFileToPNG(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validasi tipe file gambar
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan format gambar yang valid. Harap pilih file .png atau .jpg'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // Ukuran optimal untuk logo kop surat & invoice tanpa membebani localStorage
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Selalu ekspor sebagai image/png
          const pngDataUrl = canvas.toDataURL('image/png', 0.95);
          resolve(pngDataUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        reject(new Error('Gagal memproses file gambar. Pastikan file tidak rusak.'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar dari perangkat.'));
    };
    reader.readAsDataURL(file);
  });
}
