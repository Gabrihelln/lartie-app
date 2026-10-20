// O símbolo oficial (design-system/logos/svg/simbolo-creme.svg) vem com o creme da marca.
// A cor vira uma prop para usar o mesmo arquivo nas versões rosé, vinho e creme do guia.
module.exports = {
  replaceAttrValues: {
    '#FCEEE8': '{props.fill}',
    // simbolo-simplificado.svg (abaixo de 24 px) vem em on-surface.
    '#2D1F1C': '{props.fill}',
  },
};
