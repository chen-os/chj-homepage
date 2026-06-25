import type { Metadata } from "next";
import { IdentityCenter } from "../components/identity-center";

export const metadata: Metadata = {
  title: "Identity Center — CHJ",
  description: "身分証・銀行・カード名義の管理",
};

export default function IdentityPage() {
  return <IdentityCenter />;
}
