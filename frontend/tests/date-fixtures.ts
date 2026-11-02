function dateDaysAgoValue(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function dateDaysAgo(daysAgo: number): string {
  const date = dateDaysAgoValue(daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function longDateDaysAgo(daysAgo: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateDaysAgoValue(daysAgo));
}
