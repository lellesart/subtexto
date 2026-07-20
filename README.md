# Subtexto - Gerador de Lower Third

Ferramenta leve para criação, controle e exibição de lower thirds em transmissões ao vivo.

Esta é a versão pública do projeto, sem templates ou assets institucionais. O foco é uso direto em navegador, com OBS Studio via Fonte de Navegador e OBS WebSocket.

## Arquivos principais

- `index.html`: editor principal do Subtexto.
- `painel_controle.html`: painel `obs.desk` para operação rápida com OBS, cenas, fontes, áudio, monitor e envio de LTs.
- `overlay.html`: overlay transparente para adicionar como Fonte de Navegador no OBS.
- `js/overlay.js`: renderizador leve usado pelo overlay.
- `assets/`: logo e arquivos necessários em tempo de execução.

## Como usar com OBS

1. Hospede a pasta do projeto, por exemplo no GitHub Pages.
2. Abra `index.html` para criar templates, participantes e exportar/importar projetos.
3. No OBS, adicione uma Fonte de Navegador usando a URL do `overlay.html`.
4. Ative o OBS WebSocket no OBS Studio.
5. No Subtexto ou no `painel_controle.html`, conecte ao OBS WebSocket.
6. Envie ou oculte o lower third pelo editor ou pelo painel.

Exemplo de URL do overlay:

```text
overlay.html?channel=principal&res=1920x1080
```

O canal usado no painel deve ser o mesmo da URL do overlay. Se a URL não tiver `channel`, use `principal`.


## Templates e personalização

A versão pública inclui templates genéricos de lower third e modelos personalizados com upload de PNG/SVG.

No modo personalizado, a imagem carregada é mantida em memória e enviada junto do estado do overlay. Use arquivos pequenos e transparentes para manter a ferramenta rápida.

## Importação e exportação

O Subtexto permite exportar projetos `.lowerthird.json` com:

- lista de participantes;
- cargo/subtítulo;
- perfil de exibição;
- configurações visuais do template.

Esses arquivos também podem ser importados pelo `painel_controle.html`.

## Deploy

Para publicar, envie todos os arquivos desta pasta para o repositório/site:

- `index.html`
- `painel_controle.html`
- `overlay.html`
- `js/overlay.js`
- `assets/`
- `README.md`
- `CHANGELOG.md`
- `VERSION.txt`

A pasta `assets` deve permanecer junto do projeto.

## Dependências externas

Esta versão usa CDNs externos para manter o projeto simples e leve:

- Tailwind CSS;
- DaisyUI;
- Alpine.js;
- Font Awesome;
- Google Fonts;
- `obs-websocket-js` no painel `obs.desk`.

Por isso, o uso depende de internet e de liberação desses domínios na rede.

## Observações

- O overlay do OBS deve ser atualizado após deploys importantes para evitar cache antigo.
- O `overlay.html` usa versionamento na URL do `js/overlay.js` para reduzir problemas de cache.
- Visualizadores nativos podem exibir PNG/WebM transparente com fundo preto; o teste confiável deve ser feito no OBS ou em editor que leia canal alfa.

## Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE`.
