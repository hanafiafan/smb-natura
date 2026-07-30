import { sql } from "@/lib/db";
import type { UserRole } from "@/lib/database.types";

export type AccessibleBrand = { id: number; name: string; company_name: string };

/** Super admin sees every active brand; brand_admin only sees what they're assigned to in user_brands. */
export async function getAccessibleBrands(userId: string, role: UserRole): Promise<AccessibleBrand[]> {
  if (role === "super_admin") {
    return sql<AccessibleBrand[]>`
      select b.id, b.name, c.name as company_name
      from brands b join companies c on c.id = b.company_id
      where b.is_active
      order by c.name, b.name
    `;
  }
  return sql<AccessibleBrand[]>`
    select b.id, b.name, c.name as company_name
    from brands b
    join companies c on c.id = b.company_id
    join user_brands ub on ub.brand_id = b.id
    where ub.user_id = ${userId} and b.is_active
    order by c.name, b.name
  `;
}
