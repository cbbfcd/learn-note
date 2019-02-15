// 自定义一个 simple-babel-transform-jsx-plugin

// 构建属性
function getAllAttrs(attrs, t){
  let props = []
  attrs.forEach((jsxAttr, i) => {
    const name = jsxAttr.name.name
    const value = jsxAttr.value
    props.push(t.objectProperty(t.stringLiteral(name)), value)
  })
  return t.objectExpression(props)
}

export default function ({ types: t }) {
  // 定义一个访问者
  const visitor = {}

  // DFS 搜索找到所有的 JSXElement
  visitor.JSXElement = {

    // 因为是DFS所以会访问节点两次，我们只需要在第二次离开节点是做操作
    exit(path){
      // 找到开始标签
      const openingPath = path.get("openingElement");
      // 构建子集
      const children = t.react.buildChildren(openingPath.parent);
      // 获取开始标签名字
      const tagName = t.identifier(openingPath.node.name.name)
      // 获取属性
      const attrs = getAllAttrs(openingPath.node.attributes, t)
      // 构建调用函数 'React.createElemnt'
      const createElement = t.memberExpression(t.identifier("React"),t.identifier("createElement"))
      // 完成替换为 React.createElement
      path.replaceWith(t.inherits(t.callExpression(createElement, [tagName, attrs, ...children]), path.node))
    }
  }

  return {
    visitor,
    // 语法继承
    inherits: {
      manipulateOptions(opts, parserOpts){
        if (
          parserOpts.plugins.some(
            p => (Array.isArray(p) ? p[0] : p) === "typescript",
          )
        ) {
          return;
        }
  
        parserOpts.plugins.push("jsx");
      }
    }
  }
}