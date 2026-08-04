import { Project, SyntaxKind, JsxSelfClosingElement, JsxElement, JsxOpeningElement } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

project.addSourceFilesAtPaths('src/**/*.tsx');

let modifiedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let hasModifications = false;

  // Process self-closing tags: <input type="date" />
  const selfClosingInputs = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter(node => node.getTagNameNode().getText() === 'input');

  for (const input of selfClosingInputs) {
    const typeAttr = input.getAttribute('type');
    if (typeAttr && typeAttr.getText().includes('date')) {
      const attributes = input.getAttributes().map(attr => attr.getText());
      const filteredAttrs = attributes.filter(a => !a.startsWith('type=') && !a.startsWith('lang='));
      input.replaceWithText(`<DatePicker ${filteredAttrs.join(' ')} />`);
      hasModifications = true;
    }
  }

  // Process normal elements: <input type="date"></input>
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement)
    .filter(node => node.getOpeningElement().getTagNameNode().getText() === 'input');

  for (const input of jsxElements) {
    const opening = input.getOpeningElement();
    const typeAttr = opening.getAttribute('type');
    if (typeAttr && typeAttr.getText().includes('date')) {
      const attributes = opening.getAttributes().map(attr => attr.getText());
      const filteredAttrs = attributes.filter(a => !a.startsWith('type=') && !a.startsWith('lang='));
      input.replaceWithText(`<DatePicker ${filteredAttrs.join(' ')} />`);
      hasModifications = true;
    }
  }

  if (hasModifications) {
    // Add import statement if not exists
    const hasImport = sourceFile.getImportDeclarations().some(imp => 
      imp.getModuleSpecifierValue() === '@/components/ui/date-picker'
    );
    if (!hasImport) {
      sourceFile.addImportDeclaration({
        namedImports: ['DatePicker'],
        moduleSpecifier: '@/components/ui/date-picker',
      });
    }
    sourceFile.saveSync();
    console.log(`Modified ${sourceFile.getFilePath()}`);
    modifiedCount++;
  }
}

console.log(`Done. Modified ${modifiedCount} files.`);
