// app/page.jsx
import DayChart from "@/components/DayChart";
import { load } from "cheerio";
import iconv from "iconv-lite";

export const dynamic = "force-dynamic"; // 每次請求都重新抓

// 計算本週週一到週五的日期字串
function getWeekdaysOfThisWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);

    const weekdays = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        weekdays.push(`${yyyy}${mm}${dd}`);
    }
    return weekdays;
}

// 抓取並解析單日課表
async function getDayClasses(dateString) {
    const url = `${process.env.API_BASE_URL}/ann/schedule_s.asp?month=${dateString}&class_key=y11313`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
        throw new Error(`無法抓取 ${dateString} 的課表`);
    }
    const buf = await res.arrayBuffer();
    // Big5 解碼
    const html = iconv.decode(Buffer.from(buf), "big5");

    // 用 cheerio 解析
    const $ = load(html);
    const rows = $(".style2").slice(0, 2).toArray(); // 取前兩列
    const classes2D = rows.map((row) => {
        // 取下一列的 td[1..4]
        const tds = $(row).next().find("td").slice(1, 5).toArray();
        return tds.map((td) => {
            const b = $(td).find("b");
            return b.length > 0 ? b.text() : "⠀";
        });
    });

    // 攤平成一維陣列
    return [...classes2D[0], ...classes2D[1]];
}

export default async function Page() {
    const weekdays = getWeekdaysOfThisWeek();
    // 並行抓取五天資料
    const daysClasses = await Promise.all(weekdays.map(getDayClasses));

    return (
        <main>
            <h1>Y113 週課表</h1>
            <div className="chart-container">
                {daysClasses.map((classes, idx) => (
                    <DayChart key={idx} classes={classes} />
                ))}
            </div>
        </main>
    );
}
