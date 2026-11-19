// Kategori & budget awal (contoh, bisa diubah di aplikasi). Tidak ada transaksi dummy.
export const DEF=()=>({tx:[],saldoAwal:0,budget:{'Belanja Bahan Masak':500000,'Makan di Luar':400000,'Token Listrik':100000,'Main Bareng Teman':300000,'Date Bareng Pacar':400000},
cats:{income:{'Uang Bulanan':{i:'💵',s:[]},'Uang Saku':{i:'👛',s:[]},'Gaji atau Penghasilan':{i:'💼',s:[]},'Transfer Masuk':{i:'🏦',s:[]},'Bonus':{i:'🎁',s:[]},'Lainnya':{i:'✨',s:[]}},
expense:{'Belanja Bahan Masak':{i:'🥬',s:['Sayuran','Daging dan Ayam','Ikan dan Seafood','Bumbu Dapur','Beras dan Kebutuhan Pokok','Minyak dan Bahan Pelengkap','Lainnya']},
'Makan di Luar':{i:'🍜',s:['Sarapan','Makan Siang','Makan Malam','Jajan atau Camilan','Minuman atau Kopi','Delivery Food','Lainnya']},
'Token Listrik':{i:'⚡',s:['Pembelian Token Listrik','Lainnya']},
'Main Bareng Teman':{i:'🎮',s:['Nongkrong','Makan Bareng','Nonton Film','Traveling atau Jalan-Jalan','Game atau Hiburan','Transportasi','Lainnya']},
'Date Bareng Pacar':{i:'💕',s:['Makan Bareng','Nonton Film','Ngopi atau Nongkrong','Jalan-Jalan','Membeli Hadiah','Wisata atau Traveling','Transportasi','Aktivitas atau Hiburan','Lainnya']},
'Kebutuhan Pribadi':{i:'🧴',s:['Perawatan Diri','Perlengkapan Mandi','Pakaian','Kebutuhan Kuliah','Kesehatan','Lainnya']},
'Transportasi':{i:'🛵',s:['Bensin','Parkir','Ojek Online','Transportasi Umum','Lainnya']},
'Lain-lain':{i:'📦',s:['Pengeluaran tidak terduga','Pengeluaran tambahan']}}}});
