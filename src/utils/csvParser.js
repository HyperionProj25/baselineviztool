import Papa from 'papaparse';

// Parse Blast Motion CSV
export function parseBlastCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const lines = results.data;
          
          // Find the header row (starts with "Date,Equipment")
          let headerIndex = -1;
          for (let i = 0; i < Math.min(15, lines.length); i++) {
            if (lines[i] && lines[i][0] === 'Date' && lines[i][1] === 'Equipment') {
              headerIndex = i;
              break;
            }
          }
          
          if (headerIndex === -1) {
            reject(new Error('Could not find Blast data header row'));
            return;
          }
          
          const headers = lines[headerIndex];
          const data = [];
          
          // Parse data rows
          for (let i = headerIndex + 1; i < lines.length; i++) {
            const row = lines[i];
            if (!row || !row[0] || row[0].trim() === '') continue;
            
            const entry = {};
            headers.forEach((header, idx) => {
              const value = row[idx];
              const cleanHeader = header.replace(/[()]/g, '').trim();
              
              // Parse numeric values
              if (idx > 3) { // Skip Date, Equipment, Handedness, Swing Details
                entry[cleanHeader] = value === '' ? null : parseFloat(value);
              } else {
                entry[cleanHeader] = value;
              }
            });
            
            // Parse date
            if (entry.Date) {
              entry.timestamp = new Date(entry.Date).getTime();
              entry.dateStr = entry.Date;
            }
            
            data.push(entry);
          }
          
          // Sort by date ascending
          data.sort((a, b) => a.timestamp - b.timestamp);
          
          // Extract player name from filename
          const filename = file.name;
          const nameMatch = filename.match(/Metrics - (.+?) -/);
          const playerName = nameMatch ? nameMatch[1] : filename.replace('.csv', '');
          
          resolve({
            playerName,
            type: 'blast',
            data,
            filename: file.name
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

// Parse HitTrax CSV
export function parseHitTraxCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const lines = results.data;
          
          if (lines.length < 2) {
            reject(new Error('HitTrax file appears to be empty'));
            return;
          }
          
          const headers = lines[0].map(h => h.trim());
          const data = [];
          
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            if (!row || !row[0] || row[0].trim() === '') continue;
            
            const entry = {};
            headers.forEach((header, idx) => {
              const value = row[idx] ? row[idx].trim() : '';
              
              // Parse numeric values (skip Date and Time)
              if (header !== 'Date' && header !== 'Time' && header !== 'Tag') {
                entry[header] = value === '' ? null : parseFloat(value);
              } else {
                entry[header] = value;
              }
            });
            
            // Parse date
            if (entry.Date) {
              const dateStr = entry.Date + (entry.Time ? ' ' + entry.Time : '');
              entry.timestamp = new Date(dateStr).getTime();
              entry.dateStr = entry.Date;
            }
            
            data.push(entry);
          }
          
          // Sort by date ascending
          data.sort((a, b) => a.timestamp - b.timestamp);
          
          // Extract player name from filename
          const filename = file.name;
          const playerName = filename.replace(/data\.csv$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
          
          resolve({
            playerName,
            type: 'hittrax',
            data,
            filename: file.name
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

// Calculate linear regression for trend line
export function calculateTrendLine(data, xKey, yKey) {
  const points = data
    .filter(d => d[yKey] !== null && d[yKey] !== undefined)
    .map(d => ({ x: d[xKey], y: d[yKey] }));
  
  if (points.length < 2) return null;
  
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate trend line points
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  
  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept }
  ];
}

// Aggregate data by session (date)
export function aggregateBySession(data) {
  const sessions = {};
  
  data.forEach(entry => {
    const dateKey = entry.dateStr?.split(' ')[0] || entry.dateStr;
    if (!dateKey) return;
    
    if (!sessions[dateKey]) {
      sessions[dateKey] = { entries: [], dateStr: dateKey };
    }
    sessions[dateKey].entries.push(entry);
  });
  
  return Object.values(sessions).map(session => {
    const avg = {};
    const keys = Object.keys(session.entries[0] || {});
    
    keys.forEach(key => {
      if (key === 'Date' || key === 'dateStr' || key === 'timestamp' || 
          key === 'Equipment' || key === 'Handedness' || key === 'Swing Details' ||
          key === 'Time' || key === 'Tag') {
        avg[key] = session.entries[0][key];
        return;
      }
      
      const values = session.entries
        .map(e => e[key])
        .filter(v => v !== null && v !== undefined && !isNaN(v));
      
      if (values.length > 0) {
        avg[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });
    
    avg.dateStr = session.dateStr;
    avg.timestamp = session.entries[0].timestamp;
    avg.swingCount = session.entries.length;
    
    return avg;
  }).sort((a, b) => a.timestamp - b.timestamp);
}
