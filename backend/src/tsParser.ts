import * as ts from 'typescript';

export interface PropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
}

export interface InterfaceDefinition {
  name: string;
  properties: { [key: string]: PropertyDefinition };
}

/**
 * Parses a TypeScript source string and extracts interfaces and type aliases.
 * Returns a map of InterfaceName -> InterfaceDefinition
 */
export function parseTypeScriptToSchema(source: string): { [key: string]: InterfaceDefinition } {
  const result: { [key: string]: InterfaceDefinition } = {};
  
  // Create a source file
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    source,
    ts.ScriptTarget.Latest,
    true
  );

  // Helper to extract type string from a TypeNode
  function getTypeString(typeNode?: ts.TypeNode): string {
    if (!typeNode) return 'any';
    
    // Quick and dirty print of the type node
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    return printer.printNode(ts.EmitHint.Unspecified, typeNode, sourceFile).trim();
  }

  // Visit nodes
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.text;
      const properties: { [key: string]: PropertyDefinition } = {};

      node.members.forEach((member) => {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          const propName = member.name.text;
          const propType = getTypeString(member.type);
          const optional = !!member.questionToken;
          
          properties[propName] = {
            name: propName,
            type: propType,
            optional
          };
        }
      });

      result[name] = { name, properties };
    } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
      // Handle "type X = { ... }"
      const name = node.name.text;
      const properties: { [key: string]: PropertyDefinition } = {};

      node.type.members.forEach((member) => {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          const propName = member.name.text;
          const propType = getTypeString(member.type);
          const optional = !!member.questionToken;
          
          properties[propName] = {
            name: propName,
            type: propType,
            optional
          };
        }
      });

      result[name] = { name, properties };
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
}
