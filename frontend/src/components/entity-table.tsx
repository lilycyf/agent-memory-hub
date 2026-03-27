import type { Entity } from "@/lib/types";
import { EntityTableCells } from "@/components/entity-index-row";

type EntityTableProps = {
  entities: Entity[];
  hrefFor: (entity: Entity) => string;
};

export function EntityTable({ entities, hrefFor }: EntityTableProps) {
  return (
    <div className="entity-table-wrap">
      <table className="entity-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Repository</th>
            <th scope="col">arXiv</th>
            <th scope="col">Website</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity) => (
            <tr key={entity.entityId}>
              <EntityTableCells entity={entity} detailHref={hrefFor(entity)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
