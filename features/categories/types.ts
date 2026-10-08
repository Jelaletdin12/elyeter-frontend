/**
 * ✅ DOĞRULANDI — gerçek backend curl çıktısından (2026-09-14):
 * POST/GET /categories, GET /categories/tree, GET/PATCH/DELETE
 * /categories/{id}.
 *
 * Hiyerarşik kategori desteği:
 * parent > child > nested child
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

  /**
   * GET /categories/tree response'unda children
   * recursive olarak gelir.
   */
  children?: CategoryTreeNode[];

  /**
   * findOne response'unda gelir.
   */
  parent?: Category & {
    translations: CategoryTranslation[];
  };

  /**
   * findAll response'unda gelir.
   */
  _count?: {
    children: number;
  };
};

/**
 * GET /categories/tree response.
 *
 * Recursive category tree.
 */
export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};

export type CategoryListResponse = {
  items: Category[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Create / update translation input.
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

  /**
   * POST /media/uploads?context=CATEGORY_IMAGE
   * response'undan alınan media id.
   */
  imageMediaId?: string;

  translations: CategoryTranslationInput[];
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/**
 * Return translation for requested locale.
 *
 * Fallback:
 * 1. requested locale
 * 2. first available translation
 */
export function categoryTranslation(
  category: Category,
  locale: string,
): CategoryTranslation | undefined {
  return category.translations.find((t) => t.locale === locale) ?? category.translations[0];
}

/* =========================================================
   CATEGORY TREE → SELECT OPTIONS
   ========================================================= */

/**
 * SearchableSelect içerisinde kullanılacak flattened
 * category option tipi.
 *
 * depth:
 *   0 = root category
 *   1 = child
 *   2 = nested child
 *
 * ÖNEMLİ:
 *
 * Burada artık label içerisine:
 *
 *   "── Electronics"
 *   "──── Smartphones"
 *
 * gibi karakterler EKLENMEZ.
 *
 * Hierarchy UI tarafında depth ile gösterilir.
 */
export type FlattenedCategory = {
  id: string;
  label: string;

  /**
   * Category hierarchy depth.
   */
  depth: number;

  /**
   * Bu category'nin child'ları var mı?
   */
  hasChildren: boolean;

  /**
   * hasChildren alias.
   */
  isParent: boolean;

  /**
   * Backend parent id.
   */
  parentId: string | null;

  /**
   * Backend active state.
   */
  isActive: boolean;
};

/**
 * Category tree'yi SearchableSelect için düz listeye çevirir.
 *
 * Örnek:
 *
 * Electronics
 *   Smartphones
 *   Laptops
 *   Audio & Headphones
 * Food and drink
 *
 * result:
 *
 * [
 *   {
 *     id: 'electronics',
 *     label: 'Electronics',
 *     depth: 0,
 *     hasChildren: true,
 *     isParent: true,
 *   },
 *   {
 *     id: 'smartphones',
 *     label: 'Smartphones',
 *     depth: 1,
 *     hasChildren: false,
 *     isParent: false,
 *   }
 * ]
 *
 * `excludeIds` edit ekranında:
 *
 * - current category
 * - current category children
 * - nested children
 *
 * seçeneklerden çıkarılır.
 */
export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  excludeIds: Set<string> = new Set(),
  locale: CategoryLocale = 'en',
): FlattenedCategory[] {
  const result: FlattenedCategory[] = [];

  for (const node of nodes) {
    /**
     * Edit ekranında kendisi veya subtree'si
     * parent olarak seçilemez.
     */
    if (excludeIds.has(node.id)) {
      continue;
    }

    const name =
      node.translations.find((t) => t.locale === locale)?.name ??
      node.translations.find((t) => t.locale === 'en')?.name ??
      node.translations[0]?.name ??
      node.id;

    const children = node.children ?? [];
    const hasChildren = children.length > 0;

    result.push({
      id: node.id,
      label: name,

      depth,

      hasChildren,
      isParent: hasChildren,

      parentId: node.parentId,

      isActive: node.isActive,
    });

    /**
     * Recursive children.
     */
    if (hasChildren) {
      result.push(...flattenCategoryTree(children, depth + 1, excludeIds, locale));
    }
  }

  return result;
}

/* =========================================================
   CATEGORY SUBTREE HELPERS
   ========================================================= */

/**
 * Verilen node'un:
 *
 * - kendisini
 * - tüm children'larını
 * - tüm nested children'larını
 *
 * Set olarak döndürür.
 *
 * Edit ekranında kendi kendisinin veya
 * kendi child'ının parent yapılmasını engellemek için kullanılır.
 */
export function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>([node.id]);

  if (node.children?.length) {
    for (const child of node.children) {
      for (const id of collectDescendantIds(child)) {
        ids.add(id);
      }
    }
  }

  return ids;
}

/**
 * Tree içerisinde targetId'yi bulur.
 *
 * Bulduğu category'nin:
 *
 * - kendisini
 * - bütün descendants'larını
 *
 * döndürür.
 */
export function collectSubtreeIds(tree: CategoryTreeNode[], targetId: string): Set<string> {
  const memo = new Map<string, CategoryTreeNode>();

  const index = (nodes: CategoryTreeNode[]) => {
    for (const node of nodes) {
      memo.set(node.id, node);

      if (node.children?.length) {
        index(node.children);
      }
    }
  };

  index(tree);

  const target = memo.get(targetId);

  if (!target) {
    return new Set([targetId]);
  }

  return collectDescendantIds(target);
}
