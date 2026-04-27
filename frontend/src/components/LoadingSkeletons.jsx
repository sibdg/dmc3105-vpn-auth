import { Card, Placeholder } from "react-bootstrap";

export function ConnectionSkeleton() {
  return (
    <div className="d-flex flex-column gap-3" aria-hidden>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Placeholder as="strong" animation="glow" className="w-50">
            <Placeholder xs={12} />
          </Placeholder>
          <Placeholder.Button variant="outline-primary" size="sm" xs={4} />
        </div>
        <div className="border rounded p-3">
          <Placeholder as="div" animation="wave" className="mb-2">
            <Placeholder xs={12} />
          </Placeholder>
          <Placeholder as="div" animation="wave" className="mb-2">
            <Placeholder xs={10} />
          </Placeholder>
          <Placeholder as="div" animation="wave">
            <Placeholder xs={11} />
          </Placeholder>
        </div>
      </div>
      <div className="d-flex flex-column align-items-center">
        <Placeholder as="strong" animation="glow" className="mb-2 w-50">
          <Placeholder xs={12} />
        </Placeholder>
        <div
          className="rounded bg-secondary-subtle border"
          style={{ width: 220, height: 220 }}
        />
      </div>
    </div>
  );
}

export function RouteCheckSkeleton() {
  return (
    <Card className="mx-auto" style={{ maxWidth: "460px" }}>
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={7} />
        </Placeholder>
        <Placeholder as="p" animation="wave" className="mb-2">
          <Placeholder xs={12} /> <Placeholder xs={9} />
        </Placeholder>
        <Placeholder as="p" animation="wave" className="mb-0">
          <Placeholder xs={8} />
        </Placeholder>
      </Card.Body>
    </Card>
  );
}
