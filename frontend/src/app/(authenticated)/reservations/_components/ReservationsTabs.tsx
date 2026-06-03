"use client";

import { Tabs } from "@/src/design-system/navigation/Tabs";
import { TABS, Tab } from "../_utils/constants";

type Props = {
  value: Tab;
  onChange: (value: Tab) => void;
  show: boolean;
};

export function ReservationsTabs({ value, onChange, show }: Props) {
  if (!show) return null;

  return <Tabs items={TABS} value={value} onChange={onChange} />;
}
