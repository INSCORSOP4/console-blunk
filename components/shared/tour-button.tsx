"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DriveStep } from "@/lib/tour/driver";
import { iniciarTour } from "@/lib/tour/driver";

/** Botón de ayuda que arranca un recorrido guiado sobre los elementos de la página actual. */
export function TourButton({ pasos, className }: { pasos: DriveStep[]; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label="Cómo funciona esta pantalla"
            onClick={() => iniciarTour(pasos)}
          >
            <HelpCircle />
          </Button>
        }
      />
      <TooltipContent>Cómo funciona esta pantalla</TooltipContent>
    </Tooltip>
  );
}
