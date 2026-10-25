import { driver, type Config, type DriveStep } from "driver.js";

export type { DriveStep };

const CONFIG_BASE: Config = {
  showProgress: true,
  progressText: "{{current}} de {{total}}",
  nextBtnText: "Siguiente →",
  prevBtnText: "← Anterior",
  doneBtnText: "Listo",
  overlayOpacity: 0.65,
  stagePadding: 6,
  popoverClass: "blunk-tour-popover",
};

/** Arranca un recorrido guiado sobre los pasos de la página actual. */
export function iniciarTour(steps: DriveStep[]) {
  driver({ ...CONFIG_BASE, steps }).drive();
}
