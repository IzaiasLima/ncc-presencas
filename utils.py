def presence_matrix(persons, presences, weeks):
    # Obter todas as semanas únicas e ordenar
    # weeks = sorted(set(p.week for p in presences))

    # Criar mapa de presenças por pessoa e semana
    presence_map = {}
    for p in presences:
        if p.person_id not in presence_map:
            presence_map[p.person_id] = {}
        presence_map[p.person_id][p.week] = p.present

    # Criar linhas da matriz
    rows = []
    for person in persons:
        week_data = []
        for week in weeks:
            has_data = person.id in presence_map and week in presence_map[person.id]
            week_data.append(
                {
                    "week": week,
                    "current_week": is_current(week),
                    "present": presence_map[person.id][week] if has_data else False,
                }
            )
        rows.append({"name": person.name, "weekData": week_data})

    # Calcular totais por semana
    week_totals = []
    total_persons = len(persons)
    for week in weeks:
        week_presences = [p for p in presences if p.week == week]
        present = len([p for p in week_presences if p.present])
        absent = total_persons - present
        week_totals.append(
            {
                "week": week,
                "present": present,
                "percent": round(present / total_persons, 2) * 100,
                "absent": absent,
                "total": total_persons,
            }
        )

    # Calcular estatísticas gerais
    total_cells = total_persons * len(weeks)
    total_present = len([p for p in presences if p.present])
    percent_present = (
        0 if total_cells == 0 else round(total_present / total_cells, 2) * 100
    )
    total_absent = total_cells - total_present

    heads = [f"S{x}★" if current_week() == x else f"S{x}" for x in weeks]

    return {
        "heads": heads,
        "weeks": weeks,
        "rows": rows,
        "weekTotals": week_totals,
        "stats": {
            "totalPersons": total_persons,
            "totalPresent": total_present,
            "percentPresent": percent_present,
            "totalAbsent": total_absent,
        },
    }


def current_week():
    from datetime import datetime

    today = datetime.now()
    begin_year = datetime(today.year, 1, 1)
    days_today = (today - begin_year).days
    atual_week = ((days_today + begin_year.weekday() + 1) // 7) + 1

    return max(1, min(atual_week, 53))


def is_current(week):
    return week == current_week()
