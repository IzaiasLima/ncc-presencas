# NCC Presenças

Registrar a presença dos participantes dos grupos de comunhão Núcleos de Convivência Cristã. Permite ter uma visão mínima da participação dos membros de cada grupo.

## Gestão
Cada usuário (tabela Users) é um gestor de grupo. Cada membro (tabela Person) tem seu registro assiciado a um gestor.  
O sistema mostra uma estatística mínima sobre as participações de cada membro no grupo.


## Limitações
 Nesta versão inicial não há:
- interface para gerir os Users. Serão incluídos pela interface Swegger (/docs), endpoint /register
- interface para excluir participantes, pois não será necessário neste promeiro momento

## Tecnologias
- Python com FastAPI
- [UV](https://docs.astral.sh/uv/) como gestor de enviroment
- Banco de dados Sqlite localmente. Em produção adotamos a plataforma [Turso](https://turso.tech/).

    ### Comando úteis do Sqlite

    ```shell
    .open ncc.db #Equivalente em Turso: 'turso db shell ncc.db'
    .tables
    .headers ON
    .mode box | .mode table

    Obs.: 'headers' não funciona em Turso e 'mode' tem outro propósito.
    ```
