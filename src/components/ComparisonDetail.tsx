"use client";

import { FieldComparison } from "@/lib/types";
import FieldMatchIndicator from "./FieldMatchIndicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  comparisons: FieldComparison[];
}

export default function ComparisonDetail({ comparisons }: Props) {
  if (comparisons.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Field</TableHead>
          <TableHead>Application Data</TableHead>
          <TableHead>Found on Label</TableHead>
          <TableHead className="w-[100px] text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comparisons.map((comp) => (
          <TableRow key={comp.fieldName}>
            <TableCell className="font-medium text-sm">
              {comp.displayName}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {comp.expected ?? (
                <span className="text-gray-400 italic">Not provided</span>
              )}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {comp.extracted ?? (
                <span className="text-gray-400 italic">Not found</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              <Tooltip>
                <TooltipTrigger>
                  <FieldMatchIndicator status={comp.status} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{comp.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
