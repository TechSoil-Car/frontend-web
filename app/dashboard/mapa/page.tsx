import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { PlantationMapScreen } from "@/features/map";

export const metadata: Metadata = {
  title: "Mapa da lavoura | TechSoil Systems",
  description: "Mapeie as linhas de plantio e prepare rotas de monitoramento.",
};

export default function PlantationMapPage() {
  return <PlantationMapScreen />;
}
