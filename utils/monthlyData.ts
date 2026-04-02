export type Log = {
    timestamp: number | string;
    energy: number;
    [key: string]: any;
};

export const ENERGY_COLORS: Record<number, string> = {
    1: "#FF4D4D",
    2: "#FF8A3D",
    3: "#FFD93D",
    4: "#4DFF88",
    5: "#3DEBFF",
};

export function getMonthlyDailyAverages(selectedMonth: Date, logs: Log[]) {
    // 1. LOAD LOGS
    // Safely assign logs to an empty array if invalid
    const safeLogs = Array.isArray(logs) ? logs : [];

    // 2. FILTER BY SELECTED MONTH
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const filteredLogs = safeLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
    });

    // 3. GET DAYS IN MONTH
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 4. GROUP BY DAY
    const groupedByDay: Record<number, number[]> = {};
    for (let day = 1; day <= daysInMonth; day++) {
        groupedByDay[day] = [];
    }

    for (const log of filteredLogs) {
        const logDate = new Date(log.timestamp);
        const day = logDate.getDate();
        if (groupedByDay[day]) {
            groupedByDay[day].push(log.energy);
        }
    }

    // 5. COMPUTE DAILY AVERAGES
    // 6. FINAL OUTPUT FORMAT
    const result = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const values = groupedByDay[day];
        let average: number | null = null;
        
        if (values.length > 0) {
            const sum = values.reduce((acc, val) => acc + val, 0);
            average = sum / values.length; // Leave as float
        }
        
        result.push({
            day,
            average
        });
    }

    return result;
}

export type DailyAverage = {
    day: number;
    average: number | null;
};

export type ChartPoint = {
    x: number;
    y: number;
    day: number;
};

export function createMonthlyChartPoints(
    data: DailyAverage[],
    chartWidth: number,
    chartHeight: number
): ChartPoint[] {
    const totalDays = data.length;
    const points: ChartPoint[] = [];

    for (const entry of data) {
        // Handle null values
        if (entry.average === null) {
            continue;
        }

        // Compute X
        let x = 0;
        if (totalDays > 1) {
            x = ((entry.day - 1) / (totalDays - 1)) * chartWidth;
        }

        // Compute Y
        const y = chartHeight - ((entry.average - 1) / 4) * chartHeight;

        points.push({ x, y, day: entry.day });
    }

    return points;
}


export type MonthlyLevelMapEntry = {
    day: number;
    level: number | null;
    color: string | null;
};

export function createMonthlyLevelMap(
    dailyAverages: DailyAverage[]
): MonthlyLevelMapEntry[] {
    return dailyAverages.map((entry) => {
        if (entry.average === null) {
            return { day: entry.day, level: null, color: null };
        }

        let rounded = Math.round(entry.average);
        
        if (rounded < 1) rounded = 1;
        if (rounded > 5) rounded = 5;

        return {
            day: entry.day,
            level: rounded,
            color: ENERGY_COLORS[rounded] || null,
        };
    });
}

export type MonthlyStripLayoutEntry = {
    day: number;
    x: number;
    width: number;
    slotWidth: number;
    y: number | null;
    height: number | null;
    color: string | null;
};

export function createMonthlyStripLayout(
    levelMap: MonthlyLevelMapEntry[],
    chartWidth: number,
    chartHeight: number
): MonthlyStripLayoutEntry[] {
    const totalDays = levelMap.length;

    if (totalDays === 0) {
        return [];
    }

    const slotWidth = chartWidth / totalDays;
    const barWidth = slotWidth * 0.45;
    
    const levelHeight = chartHeight / 5;
    const barHeight = levelHeight * 0.6;

    return levelMap.map((entry) => {
        const x = (entry.day - 1) * slotWidth + (slotWidth - barWidth) / 2;

        if (entry.level === null) {
            return {
                day: entry.day,
                x,
                width: barWidth,
                slotWidth,
                y: null,
                height: null,
                color: null,
            };
        }

        const y = chartHeight - (entry.level * levelHeight) + (levelHeight - barHeight) / 2;

        return {
            day: entry.day,
            x,
            width: barWidth,
            slotWidth,
            y,
            height: barHeight,
            color: entry.color,
        };
    });
}
