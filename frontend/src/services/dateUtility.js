
// z czacika
export function chooseLaterDate(date1, date2) {
	function parseInput(d) {
		if (!d && d !== 0) return null;
		if (d instanceof Date) return d;
		if (typeof d === 'number') return new Date(d);
		if (typeof d !== 'string') return null;
		if (d.includes('--')) return null;

		// Try native parsing (ISO, RFC, etc.)
		const parsedIso = new Date(d);
		if (!isNaN(parsedIso)) return parsedIso;

		// Try common localized format: DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
		const m = d.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
		if (m) {
			const day = parseInt(m[1], 10);
			const month = parseInt(m[2], 10) - 1;
			let year = parseInt(m[3], 10);
			if (year < 100) year += 2000;
			const parsed = new Date(year, month, day);
			if (!isNaN(parsed)) return parsed;
		}

		return null;
	}

	const a = parseInput(date1);
	const b = parseInput(date2);

	// If neither parses, prefer non-placeholder string if available
	if (!a && !b) {
		if (typeof date1 === 'string' && !date1.includes('--')) return date1;
		if (typeof date2 === 'string' && !date2.includes('--')) return date2;
		return date1 || date2 || '';
	}

	if (!a) {
		return typeof date2 === 'string' ? date2 : (b ? b.toISOString() : '');
	}
	if (!b) {
		return typeof date1 === 'string' ? date1 : (a ? a.toISOString() : '');
	}

	// Both parsed: return the original input (string) corresponding to the later date when possible
	if (a >= b) return typeof date1 === 'string' ? date1 : a.toISOString();
	return typeof date2 === 'string' ? date2 : b.toISOString();
}