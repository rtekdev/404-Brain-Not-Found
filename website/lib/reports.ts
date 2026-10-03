export interface ReportsResponse { 
  id: number;
  name: string;
  location: string;
};

export async function getReports(): Promise<ReportsResponse[]> {
  const mockData = [
    {
      "id": 1,
      name: "Report 1",
      location: "ul. Jaworskiego 16"
    },
    {
      "id": 2,
      name: "Report 2",
      location: "ul. Warszawska"
    },
    {
      "id": 3,
      name: "Report 3",
      location: "ul. Bakłarzano-Pomarańczy"
    },
  ]

  await new Promise(r => setTimeout(r, 5*1000));

  return mockData
}