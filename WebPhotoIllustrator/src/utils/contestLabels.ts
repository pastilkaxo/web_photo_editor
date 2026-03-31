export function contestBadgeLabel(kind: string, weekIndex: number): string {
    switch (kind) {
        case "COMMUNITY_GOLD":
            return `Победитель недели #${weekIndex} (1 место)`;
        case "COMMUNITY_SILVER":
            return `Победитель недели #${weekIndex} (2 место)`;
        case "COMMUNITY_BRONZE":
            return `Победитель недели #${weekIndex} (3 место)`;
        case "MOST_DISCUSSED":
            return `Звезда недели: самый обсуждаемый кадр (#${weekIndex})`;
        default:
            return `Награда конкурса #${weekIndex}`;
    }
}

export function contestPhaseDescription(phase: string): string {
    switch (phase) {
        case "SUBMISSION":
            return "Приём работ до пятницы. Сохраните проект в редакторе и нажмите «Отправить на конкурс».";
        case "VOTING":
            return "Фаза голосования до воскресенья. В выходные конкурсные работы чаще показываются в ленте.";
        default:
            return "Итоги подводятся в понедельник.";
    }
}
