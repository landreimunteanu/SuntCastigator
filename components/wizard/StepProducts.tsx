"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import {
  importProductsCsv,
  searchProducts,
  getSelectedProductIds,
  toggleCampaignProduct,
} from "@/lib/actions/products";
import type { CsvParseError } from "@/lib/csv/parse";

type Product = {
  id: string;
  sku: string;
  name: string;
};

interface StepProductsProps {
  campaignId: string;
}

export function StepProducts({ campaignId }: StepProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<CsvParseError[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async (searchQuery: string) => {
    const results = await searchProducts(searchQuery);
    setProducts(results as Product[]);
  }, []);

  const loadAll = useCallback(async () => {
    const [all, selected] = await Promise.all([
      searchProducts(""),
      getSelectedProductIds(campaignId),
    ]);
    setProducts(all as Product[]);
    setTotalCount(all.length);
    setSelectedIds(new Set(selected));
  }, [campaignId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, loadProducts]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadErrors([]);
    setUploadMessage("");

    try {
      const content = await file.text();
      const result = await importProductsCsv(content);
      setUploadMessage(`${result.imported} produse importate.`);
      setUploadErrors(result.errors);
      await loadAll();
    } catch (err) {
      setUploadMessage(
        err instanceof Error ? err.message : "Eroare la încărcarea fișierului"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggle = (productId: string) => {
    const isSelected = selectedIds.has(productId);
    const next = new Set(selectedIds);
    if (isSelected) next.delete(productId);
    else next.add(productId);
    setSelectedIds(next);

    startTransition(() => {
      toggleCampaignProduct(campaignId, productId, !isSelected);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Produse eligibile
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Importați lista de produse care sunt eligibile pentru această
          campanie.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <label className="block text-sm font-medium text-neutral-700">
          Import CSV (coloane: sku, name)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
        />
        {isUploading && (
          <p className="mt-2 text-sm text-neutral-600">Se încarcă...</p>
        )}
        {uploadMessage && (
          <p className="mt-2 text-sm text-neutral-700">{uploadMessage}</p>
        )}
        {uploadErrors.length > 0 && (
          <div className="mt-2 rounded-md bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">
              {uploadErrors.length} rânduri respinse:
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-red-700">
              {uploadErrors.slice(0, 10).map((err, i) => (
                <li key={i}>
                  Rând {err.row}: {err.reason}
                </li>
              ))}
              {uploadErrors.length > 10 && (
                <li>...și încă {uploadErrors.length - 10}</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="Caută după nume sau SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200">
        {products.length === 0 ? (
          <p className="p-4 text-center text-sm text-neutral-500">
            Niciun produs găsit. Importă un CSV pentru a începe.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => handleToggle(product.id)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {product.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {product.sku}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-neutral-600">
        {selectedIds.size} produse selectate din {totalCount} disponibile
      </p>
    </div>
  );
}
