# GIBIPRINTS V22

Correção do envio do catálogo para a nuvem:
- fotos dos produtos continuam sendo enviadas ao Storage;
- fotos das Linhas/Mostruários são enviadas diretamente para `gibiprints-fotos/linhas/...` durante **Enviar catálogo atual para a nuvem**;
- as referências remotas das fotos das linhas são gravadas junto ao snapshot, sem duplicar o upload em `backup-midia`;
- o aviso final separa fotos de produtos e fotos de linhas;
- o botão `📷 Enviar Fotos` das linhas e produtos permanece disponível.

Não altera as fotos originais armazenadas no aparelho.


V24: diagnóstico detalhado de upload, uploads de linhas sequenciais, erros do Storage não são mais ocultados e referências remotas são persistidas após cada linha.
