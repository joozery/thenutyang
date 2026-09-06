const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'admin', 'new-document-client.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. DocPrefill items type
content = content.replace(
  'items: { productId?: string; description: string; qty: number; unitPrice: number; discount: number }[];',
  'items: { productId?: string; description: string; qty: number; unitPrice: number; discount: number; lineCostPrice?: number }[];'
);

// 2. DocPrefill costPrice
content = content.replace(
  'globalDiscount?:    number;\n};',
  'globalDiscount?:    number;\n  costPrice?:         number;\n};'
);

// 3. lines state initialization
content = content.replace(
  `discountType: 'pct' as const, lineCostPrice: 0 }))`,
  `discountType: 'pct' as const, lineCostPrice: it.lineCostPrice ?? 0 }))`
);

// 4. add manualCostPrice state
content = content.replace(
  'const [productPickerLineKey, setProductPickerLineKey] = useState<number | null>(null);',
  'const [productPickerLineKey, setProductPickerLineKey] = useState<number | null>(null);\n  const [manualCostPrice, setManualCostPrice] = useState<number | null>(prefill?.costPrice ?? null);'
);

// 5. selectPickerEntry
content = content.replace(
  'setProductPickerLineKey(null);\n  }',
  'setProductPickerLineKey(null);\n    setManualCostPrice(null);\n  }'
);

// 6. addLine
content = content.replace(
  `lineCostPrice: 0 }]);`,
  `lineCostPrice: 0 }]);\n    setManualCostPrice(null);`
);

// 7. addLineAndOpenPicker
content = content.replace(
  'setProductPickerLineKey(key);\n  };',
  'setProductPickerLineKey(key);\n    setManualCostPrice(null);\n  };'
);

// 8. removeLine
content = content.replace(
  'p.filter(l => l.key !== key));',
  'p.filter(l => l.key !== key));\n    setManualCostPrice(null);'
);

// 9. updateLine
content = content.replace(
  ': l));',
  ': l));\n    setManualCostPrice(null);'
);

// 10. handleSubmit
content = content.replace(
  'costPrice: lines.reduce((sum, l) => sum + l.lineCostPrice * l.qty, 0),',
  'costPrice: manualCostPrice ?? lines.reduce((sum, l) => sum + l.lineCostPrice * l.qty, 0),'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done replacing!');
