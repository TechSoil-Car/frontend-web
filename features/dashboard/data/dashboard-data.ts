export const soilMetrics = [
  { id: "moisture", label: "Umidade do solo", value: "64", unit: "%", trend: "+3,2%", status: "Ideal", tone: "green", points: "2,25 18,22 34,19 50,20 66,13 82,15 98,8" },
  { id: "temperature", label: "Temperatura", value: "23,8", unit: "°C", trend: "−0,8°", status: "Estável", tone: "amber", points: "2,15 18,12 34,14 50,8 66,11 82,10 98,13" },
  { id: "ph", label: "pH do solo", value: "6,4", unit: "pH", trend: "+0,1", status: "Adequado", tone: "green", points: "2,20 18,18 34,18 50,14 66,15 82,11 98,10" },
  { id: "conductivity", label: "Condutividade", value: "1,8", unit: "mS/cm", trend: "+0,2", status: "Atenção", tone: "orange", points: "2,23 18,22 34,17 50,19 66,12 82,9 98,5" },
] as const;

export const alerts = [
  { id: 1, title: "Umidade abaixo do ideal", detail: "Setor C · Fileiras 18–24", time: "há 18 min", level: "warning" },
  { id: 2, title: "Leitura concluída", detail: "Sensor TS-04 · 7 parâmetros", time: "há 42 min", level: "success" },
  { id: 3, title: "Carrinho retornou à base", detail: "Expedição #028 finalizada", time: "há 1h", level: "info" },
] as const;

export const devices = [
  { name: "Sensor Norte", code: "TS-01", battery: 92, state: "Online" },
  { name: "Sensor Central", code: "TS-04", battery: 78, state: "Online" },
  { name: "Carrinho Autônomo", code: "TC-02", battery: 64, state: "Em base" },
] as const;

export const sectors = [
  { id: "A", name: "Setor A", moisture: "68%", status: "Saudável", position: "sectorA" },
  { id: "B", name: "Setor B", moisture: "62%", status: "Saudável", position: "sectorB" },
  { id: "C", name: "Setor C", moisture: "47%", status: "Atenção", position: "sectorC" },
] as const;

export const chartSeries = {
  "24h": "0,78 55,70 110,73 165,54 220,59 275,46 330,51 385,30 440,37 495,21 550,29 605,18 660,25",
  "7d": "0,65 55,61 110,66 165,50 220,55 275,42 330,48 385,40 440,28 495,33 550,20 605,25 660,17",
  "30d": "0,70 55,67 110,58 165,62 220,49 275,53 330,39 385,44 440,31 495,37 550,26 605,30 660,22",
} as const;

export type ChartRange = keyof typeof chartSeries;
