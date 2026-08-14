const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const oldCheck = `    const isOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0); // 16:30 - 23:00 TR

    if (!isOpen) {
      return;
    }

    try {
      const currentActive = Array.isArray(activeUsSwingTradesRef.current) ? activeUsSwingTradesRef.current : [];`;

const newCheck = `    const isActuallyOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0); // 16:30 - 23:00 TR
    const currentActive = Array.isArray(activeUsSwingTradesRef.current) ? activeUsSwingTradesRef.current : [];
    
    // Eğer hiç işlem yoksa (sistem ilk açıldığında veya sepet boşaldığında)
    // piyasa kapalı olsa bile geçmiş verilere dayanarak en az 1 kez tarama yapsın ve hisseleri bulsun.
    const isOpen = isActuallyOpen || (currentActive.length === 0 && !isOnlyActive);

    if (!isOpen) {
      return;
    }

    try {
      const isCapacityFull = currentActive.length >= 5;`;

content = content.replace(oldCheck, newCheck);

// Clean up isCapacityFull line because we removed it from the block above
// Wait, actually I removed `const currentActive = ...` from inside `try`. I must make sure I don't duplicate it or break it.
// Let's replace the whole block more carefully.

const oldBlock = `    // US Market Hours Check
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() + (now.getMinutes() / 60);
    const isOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0); // 16:30 - 23:00 TR

    if (!isOpen) {
      return;
    }

    try {
      const currentActive = Array.isArray(activeUsSwingTradesRef.current) ? activeUsSwingTradesRef.current : [];
      const isCapacityFull = currentActive.length >= 5;`;

const newBlock = `    // US Market Hours Check
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() + (now.getMinutes() / 60);
    const isActuallyOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0); // 16:30 - 23:00 TR
    
    const currentActive = Array.isArray(activeUsSwingTradesRef.current) ? activeUsSwingTradesRef.current : [];
    const isOpen = isActuallyOpen || (currentActive.length === 0 && !isOnlyActive);

    if (!isOpen) {
      return;
    }

    try {
      const isCapacityFull = currentActive.length >= 5;`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('src/App.jsx', content);
console.log('Successfully updated App.jsx for initial scan logic');
