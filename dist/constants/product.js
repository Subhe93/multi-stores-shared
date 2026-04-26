"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFieldType = exports.AttributeType = exports.CustomizationType = exports.ProductStatus = exports.ProductType = void 0;
var ProductType;
(function (ProductType) {
    ProductType["TRADITIONAL"] = "TRADITIONAL";
    ProductType["CUSTOMIZABLE"] = "CUSTOMIZABLE";
})(ProductType || (exports.ProductType = ProductType = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["PUBLISHED"] = "PUBLISHED";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var CustomizationType;
(function (CustomizationType) {
    CustomizationType["PRINT"] = "PRINT";
    CustomizationType["ENGRAVE"] = "ENGRAVE";
    CustomizationType["PRINT_3D"] = "PRINT_3D";
    CustomizationType["EMBROIDERY"] = "EMBROIDERY";
    CustomizationType["HANDMADE"] = "HANDMADE";
    CustomizationType["HEAT_PRESS"] = "HEAT_PRESS";
    CustomizationType["SCREEN_PRINT"] = "SCREEN_PRINT";
    CustomizationType["UV_PRINT"] = "UV_PRINT";
    CustomizationType["CNC"] = "CNC";
    CustomizationType["OTHER"] = "OTHER";
})(CustomizationType || (exports.CustomizationType = CustomizationType = {}));
var AttributeType;
(function (AttributeType) {
    AttributeType["TEXT"] = "TEXT";
    AttributeType["NUMBER"] = "NUMBER";
    AttributeType["SELECT"] = "SELECT";
    AttributeType["MULTI_SELECT"] = "MULTI_SELECT";
    AttributeType["BOOLEAN"] = "BOOLEAN";
    AttributeType["COLOR"] = "COLOR";
    AttributeType["DIMENSIONS"] = "DIMENSIONS";
})(AttributeType || (exports.AttributeType = AttributeType = {}));
var CustomFieldType;
(function (CustomFieldType) {
    CustomFieldType["TEXT"] = "TEXT";
    CustomFieldType["TEXTAREA"] = "TEXTAREA";
    CustomFieldType["NUMBER"] = "NUMBER";
    CustomFieldType["IMAGE"] = "IMAGE";
    CustomFieldType["FILE"] = "FILE";
    CustomFieldType["SELECT"] = "SELECT";
    CustomFieldType["COLOR"] = "COLOR";
    CustomFieldType["FONT"] = "FONT";
    CustomFieldType["DATE"] = "DATE";
    CustomFieldType["MULTI_IMAGE"] = "MULTI_IMAGE";
})(CustomFieldType || (exports.CustomFieldType = CustomFieldType = {}));
//# sourceMappingURL=product.js.map