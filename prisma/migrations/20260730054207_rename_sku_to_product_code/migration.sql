/*
  Warnings:

  - You are about to drop the column `sku` on the `inventory_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[branchId,productCode]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productCode` to the `inventory_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "inventory_items_branchId_sku_key";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "sku",
ADD COLUMN     "productCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_branchId_productCode_key" ON "inventory_items"("branchId", "productCode");
