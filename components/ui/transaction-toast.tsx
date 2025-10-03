import { ExternalLink } from "lucide-react";
import { NETWORK } from "@/aptos/constants";
import { getTxExplorerLink, truncateHash } from "@/aptos/helpers";

interface TransactionToastProps {
  txHash: string;
  message?: string;
}

/**
 * Reusable transaction toast content with explorer link
 */
export function TransactionToast({ txHash, message }: TransactionToastProps) {
  const explorerLink = getTxExplorerLink(txHash, NETWORK);

  return (
    <div className="space-y-2">
      {message && <div className="text-sm">{message}</div>}
      <a
        href={explorerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
        onClick={(e) => e.stopPropagation()} // Prevent toast from closing when clicking link
      >
        <span>View transaction: {truncateHash(txHash)}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
