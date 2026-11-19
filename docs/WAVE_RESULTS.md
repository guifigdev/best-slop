# Tempos e recompensas do Survival

O servidor registra o instante de conclusão e a vida restante antes de restaurar os heróis. No Torneio e no Best of All o tempo é individual; na Torre e na Guerra de equipes é compartilhado por equipe. Falhas mostram tempo de conclusão vazio e guardam a duração da tentativa separadamente. Empates no décimo de segundo têm a mesma colocação e o mesmo bônus.

A interface abre um resumo dispensável no intervalo, sem pausar a partida ou tomar foco. Ele fecha ao começar a próxima batalha. **Competição** permite rever os cinco últimos resultados, incluindo o desafio bônus como evento separado. A colocação da onda usa tempo; o placar acumulado continua usando as regras existentes de pontuação, tempo e vida.

## Recompensas sem ampliar demais a vantagem

- Onda normal: recompensa-base existente de `100 + 12 × onda`, além dos 30 XP existentes. Derrotas terminais de toda a equipe não criam um pagamento novo.
- Desempenho: até 10% da base, limitado a 40 de ouro.
- Recuperação: compensa 75% da diferença do bônus de colocação e pode recuperar parte da diferença de prêmios extras acumulados. O total de recuperação é limitado a 15% da base, no máximo 60.
- A recuperação usa o histórico de prêmios do servidor. Comprar itens, gastar o ouro da carteira ou renomear o herói não aumenta o benefício.
- Extras exigem conclusão e contribuição real: dano efetivo, cura explícita efetiva ou dano de inimigos recebido em combate. Regeneração, cura de nível e overheal não contam. Um tanque que contribuiu e caiu pode receber extras quando a equipe conclui.
- Desafio bônus: cada concluinte recebe base de 300, desempenho até 30 e recuperação até 45. Tentativas fracassadas recebem zero. A antiga diferença de 500/380/260/140 foi substituída por uma diferença pequena entre concluintes ativos.

Exemplo da onda 1, quatro jogadores ativos sem diferenças anteriores de prêmios: tempos de 12/17/22/27 segundos rendem 123/122/121/120 de ouro, respectivamente. O melhor tempo mantém vantagem, enquanto a maior parte da recompensa é acessível a todos os concluintes.

`waveResults` contém o último resultado; `roundResults`, os cinco últimos. Os pagamentos são idempotentes por modo, tipo de rodada e onda. Essa lógica não altera Castle Fight, Line Wars nem as fórmulas de atributos.
