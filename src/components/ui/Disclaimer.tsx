export function Disclaimer({ text }: { text?: string }) {
  return (
    <div className="disclaimer">
      ⚠️ {text ?? "Synthetic, illustrative demo only. No real calls, websites, or text messages are involved."}
    </div>
  );
}
