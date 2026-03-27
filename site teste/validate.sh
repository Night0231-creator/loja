#!/bin/bash
# 🔍 Script de Validação - THEMAF1A STORE v2.0
# Valida se todos os arquivos estão no lugar

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VALIDAÇÃO DE ESTRUTURA - THEMAF1A STORE v2.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
    return 0
  else
    echo -e "${RED}❌${NC} $1 (FALTA!)"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} $1/"
    return 0
  else
    echo -e "${RED}❌${NC} $1/ (FALTA!)"
    return 1
  fi
}

count=0

echo "📦 MÓDULOS ES6:"
check_file "src/js/app.js" && ((count++))
check_file "src/js/modules/utils.js" && ((count++))
check_file "src/js/modules/cart.js" && ((count++))
check_file "src/js/modules/checkout.js" && ((count++))
check_file "src/js/modules/ui.js" && ((count++))
check_file "src/js/modules/discord.js" && ((count++))

echo ""
echo "📄 PÁGINAS:"
check_file "pages/success.html" && ((count++))

echo ""
echo "🔗 NETLIFY FUNCTIONS:"
check_file "netlify/functions/create-payment.js" && ((count++))
check_file "netlify/functions/discord-notify.js" && ((count++))

echo ""
echo "📖 DOCUMENTAÇÃO:"
check_file "GUIA_IMPLEMENTACAO.md" && ((count++))
check_file "README_REFATORACAO.md" && ((count++))
check_file "CHECKLIST_PROXIMOS_PASSOS.md" && ((count++))
check_file "STATUS_REFATORACAO.html" && ((count++))
check_file "RESUMO_FINAL.txt" && ((count++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $count -eq 15 ]; then
  echo -e "${GREEN}✅ TODAS AS 15 FILES CRIADAS COM SUCESSO!${NC}"
  echo -e "${GREEN}🚀 Projeto pronto para uso${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Apenas $count/15 files encontrados${NC}"
  echo -e "${YELLOW}❌ Verifique estrutura de diretórios${NC}"
  exit 1
fi
