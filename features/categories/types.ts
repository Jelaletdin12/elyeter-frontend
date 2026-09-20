/**
 * ✅ DOĞRULANDI — gerçek backend curl çıktısından (2026-09-14):
 * POST/GET /categories, GET /categories/tree, GET/PATCH/DELETE
 * /categories/{id}. Hiyerarşik kategori desteği: parentId ile parent > sub > sub.
 */

export type CategoryLocale = 'en' | 'ru' | 'tk';

export type CategoryTranslation = {
  id: string;
  categoryId: string;
  locale: CategoryLocale;
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
};

export type Category = {
  id: string;
  isActive: boolean;
  parentId: string | null;
  imageUrl?: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[];
  /** findTree yanıtında children iç içe gelir; flat listede yoktur. */
  children?: CategoryTreeNode[];
  /** findOne response'unda parent object olarak gelir (unique incr. translations). */
  parent?: Category & { translations: CategoryTranslation[] };
  /** findAll response'unda _count.children olarak gelir (sayfanın üstünde). */
  _count?: { children: number };
};

/** GET /categories/tree yanıt tipi — iç içe kategori ağacı. */
export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};

export type CategoryListResponse = {
  items: Category[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/**
 * slug/metaTitle/metaDescription boş bırakılırsa backend name'den otomatik
 * üretiyor (CategoryTranslationDto description'ı) — bu yüzden create/update
 * formunda sadece locale+name zorunlu tutuluyor.
 */
export type CategoryTranslationInput = {
  locale: CategoryLocale;
  name: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type CreateCategoryInput = {
  isActive?: boolean;
  parentId?: string | null;
  imageUrl?: string | null;
  /** POST /media/uploads?context=CATEGORY_IMAGE'den alınan media id — MinIO'ya yüklenen görsel. */
  imageMediaId?: string;
  translations: CategoryTranslationInput[];
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export function categoryTranslation(
  category: Category,
  locale: string,
): CategoryTranslation | undefined {
  return category.translations.find((t) => t.locale === locale) ?? category.translations[0];
}

/**
 * Hiyerarşik listeden düz Select seçeneği üretir — girintili isimlerle
 * (örn. "── Electronics" / "──── Laptops"). `excludeIds`, düzenleme
 * modunda kendi kendini ve kendi alt ağaçlarını listeden çıkarır
 * (derinlik döngüsü önleme, backend zaten reddeder ama UI da engellemeli).
 */
export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  excludeIds: Set<string> = new Set(),
): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  for (const node of nodes) {
    if (excludeIds.has(node.id)) continue;
    const name =
      node.translations.find((t) => t.locale === 'en')?.name ??
      node.translations[0]?.name ??
      node.id;
    const prefix = depth === 0 ? '' : '── '.repeat(depth);
    result.push({ id: node.id, label: `${prefix}${name}` });
    if (node.children?.length) {
      result.push(...flattenCategoryTree(node.children, depth + 1, excludeIds));
    }
  }
  return result;
}

/**
 * Verilen node'un tüm altlarının ID'lerini (dahil) küme olarak toplar —
 * düzenleme modunda Parent select'te bu küme listeden çıkarılır (kendisi +
 * kendi altları parent olarak seçilemez).
 */
export function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>([node.id]);
  if (node.children) {
    for (const child of node.children) {
      for (const id of collectDescendantIds(child)) ids.add(id);
    }
  }
  return ids;
}

/**
 * Ağaçta targetId'yi arayıp o node'un kendisi + tüm alt ağacını kümeler —
 * düzenleme modunda hangi kategorinin düzenlediğini bulmak için. Ağaçtaki
 * node'un subtree'sini collectDescendantIds ile birleştirir.
 */
export function collectSubtreeIds(tree: CategoryTreeNode[], targetId: string): Set<string> {
  const memo = new Map<string, CategoryTreeNode>();
  const index = (nodes: CategoryTreeNode[]) => {
    for (const n of nodes) {
      memo.set(n.id, n);
      if (n.children?.length) index(n.children);
    }
  };
  index(tree);
  const target = memo.get(targetId);
  if (!target) return new Set([targetId]);
  return collectDescendantIds(target);
}
