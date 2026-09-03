# GIBIPRINTS V16 — Gestão + Clientes/Histórico

Versão de teste com:
- quatro abas em uma única linha: Orçamento, Produtos, Catálogo e Gestão;
- Gestão básica de pedidos confirmados, recebimentos, custos e lucro;
- confirmação de pedido move o pedido para Gestão;
- edição de pedido existente preserva o mesmo número quando escolhido; duplicação cria novo pedido;
- correção visual para as setas não sobreporem o cabeçalho;
- botões das Linhas em grade compacta de 2 colunas;
- backup completo com linhas/mostruários e inventário de mídias;
- sincronização das mídias locais para o Storage, incluindo QR Code;
- restauração do QR Code a partir do backup;
- catálogo continua fora da exportação PDF/JPG.

Esta versão usa a estrutura Supabase já existente do projeto.


## V16
- Clientes e histórico movidos para a área Gestão.
- Botão Abrir da Gestão leva automaticamente ao pedido específico na área Orçamento para edição.
- A abertura não cria novo pedido; a lógica existente de atualização/novo permanece no momento de gerar/salvar o orçamento.


V18 — upload robusto de fotos das linhas: compressão apenas para a cópia da nuvem, detecção de arquivos já existentes e retry com fallback para imagem menor, mantendo a mídia local original.


## V19 — fotos das linhas na nuvem
O backup usa um inventário único de mídias e envia também todas as fotos de Linhas/Mostruários ao Supabase Storage, mantendo referências remotas no snapshot para restauração.
