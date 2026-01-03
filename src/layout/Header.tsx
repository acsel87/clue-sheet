// src/layout/Header.tsx

type Props = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: Props) {
  return (
    <header className="topbar">
      <div className="topbarRow">
        <h1 className="title">Clue Sheet</h1>
        <button type="button" className="iconButton" onClick={onOpenSettings} aria-label="Open settings">
          ⚙︎
        </button>
      </div>
      <div className="subtitle">Settings + public lock scaffolding (next: full grid engine)</div>
    </header>
  );
}
