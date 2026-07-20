# Histórico de versões

## 1.1.0-publica — 2026-07-20

Revisão pré-deploy da versão pública.

- Adicionado `painel_controle.html` com painel `obs.desk`.
- Integração do painel com OBS WebSocket.
- Envio de lower thirds pelo painel usando o mesmo overlay fixo do Subtexto.
- Comunicação padronizada via evento `lowerThirdControl`.
- Compatibilidade extra para payloads `show/hide` e `SHOW/HIDE`.
- Campo de canal do overlay no painel, com persistência local.
- Monitor do OBS em dois modos: `Leve` e `Nítido`.
- Trava contra chamadas sobrepostas de screenshot do OBS, reduzindo carga em computadores antigos.
- Templates públicos reorganizados e refinados.
- Adicionados modelos personalizados com upload de PNG/SVG.
- Adicionado terceiro modelo personalizado ancorado à direita, com entrada e saída pelo lado direito.
- Melhorias no recorte de texto e animação de saída dos modelos personalizados.
- Cache do overlay atualizado para `obsdesk-compat-20260719`.
- README atualizado com fluxo de uso, deploy, dependências e observações de OBS.
- Adicionada licença MIT para distribuição pública.

## 1.0.0-publica — 2026-07-17

Versão inicial para distribuição pública.

- Editor de lower thirds com templates genéricos.
- Lista inicial com dados de exemplo neutros.
- Indicação destacada de participante no ar.
- Atualização de nomes pelo mesmo overlay do OBS.
- Integração com OBS WebSocket.
- Exportação de PNG e WebM.
- Fallback de Chroma Key para gravações sem transparência.
- A identidade institucional e os assets BNDES foram removidos.
