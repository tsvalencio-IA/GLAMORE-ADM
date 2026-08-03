# Mapa de integração

```text
Firebase Authentication existente
              │
              ├── valida a mesma conta e UID
              │
Realtime Database existente
              │
              ├── LEITURA: empresas/empresa-principal/produtos
              ├── LEITURA: empresas/empresa-principal/usuarios/{uid}
              │
              └── LEITURA/GRAVAÇÃO: empresas/empresa-principal/precificacao
                         ├── ficha técnica
                         ├── catálogos de custos
                         ├── cálculo versionado
                         ├── aprovação
                         ├── publicação isolada
                         └── auditoria própria
```

O sistema operacional atual não precisa receber nenhum arquivo deste novo repositório.
