"use client";

import { MatchStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  status: MatchStatus;
}

const config: Record<
  MatchStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" ; className: string }
> = {
  match: {
    label: "Match",
    variant: "default",
    className: "bg-green-600 hover:bg-green-600",
  },
  partial_match: {
    label: "Review",
    variant: "default",
    className: "bg-yellow-500 hover:bg-yellow-500 text-white",
  },
  mismatch: {
    label: "Mismatch",
    variant: "destructive",
    className: "",
  },
  missing: {
    label: "Missing",
    variant: "destructive",
    className: "",
  },
  not_required: {
    label: "Info",
    variant: "outline",
    className: "",
  },
};

export default function FieldMatchIndicator({ status }: Props) {
  const cfg = config[status];
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
