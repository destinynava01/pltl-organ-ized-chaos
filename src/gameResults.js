// The results as a spreadsheet: Teams, Answer key (with how often each organ was rejected), Students, and every
// card played. The Excel library loads only when someone downloads.
export async function downloadResults(report) {
  const XLSX = await import('xlsx')
  const book = XLSX.utils.book_new()
  const add = (name, rows, widths) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'Nothing to show.' }])
    sheet['!cols'] = widths.map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(book, sheet, name)
  }
  add('Teams', [...report.teams].sort((a, b) => b.points - a.points).map((t, i) => ({
    Place: i + 1, Team: t.name, Points: t.points, 'Systems rebuilt': `${t.systems_done}/${t.stages}`, 'Finished': t.finish_rank ? `#${t.finish_rank}` : 'No',
    'Vitals left': `${t.vitals}%`, Rejections: t.rejections,
  })), [6, 20, 8, 15, 9, 11, 11])
  add('Answer key', report.key.map((k) => ({
    Organ: k.name, 'Body system(s)': k.systems.join(' + '), Function: k.function, Rejections: k.misses, 'Wrong systems tried': k.wrong_systems.join(', '),
  })), [22, 30, 60, 11, 40])
  add('Students', report.students, [22, 16, 13, 11])
  add('Every card', report.log.map((x) => ({
    Team: x.team, Student: x.by, Organ: x.organ, System: x.system, Result: x.correct ? 'Placed ✓' : 'Rejected',
  })), [16, 20, 22, 22, 14])
  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(book, `Organized-Chaos-results-${today}.xlsx`)
}
