import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const GUIDE_ITEMS = [
  { key: "android", label: "Android" },
  { key: "ios", label: "iOS" },
  { key: "windows", label: "Windows" },
  { key: "macos", label: "macOS" },
  { key: "linux", label: "Linux" }
];

export default function GuideLinks() {
  return (
    <div className="d-flex flex-wrap gap-2 mt-3">
      {GUIDE_ITEMS.map((item) => (
        <Button as={Link} to={`/guides/${item.key}`} key={item.key} variant="outline-secondary" size="sm">
          Гайд {item.label}
        </Button>
      ))}
    </div>
  );
}
