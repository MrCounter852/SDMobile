import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import {
    Calendar,
    LocaleConfig,
    Timeline,
    CalendarProvider,
    ExpandableCalendar,
} from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useGlobal } from '../../core/global';
import GestionComercialService from '../../services/GestionComercial/gestionComercialService';

// Configure Spanish locale
LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const GestionComercialCalendar = ({ navigation, searchFilters, refreshTrigger }) => {
    const { user } = useGlobal();
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCalendarData = useCallback(async (date) => {
        if (!user?.UsuarioID) return;
        setLoading(true);
        try {
            const d = new Date(date);
            const filters = {
                ...searchFilters,
                UsuarioID: user?.UsuarioID,
                SucursalID: user?.SucursalID,
                AnoCalendario: d.getFullYear(),
                MesCalendario: d.getMonth() + 1,
                ModoCalendar: viewMode.toUpperCase(),
            };

            const response = await GestionComercialService.consultarMiCalendario(filters);

            let data = response;
            if (typeof response === 'string') {
                try { data = JSON.parse(response); } catch (e) { console.error('JSON parse error', e); }
            }

            const arrayData = Array.isArray(data) ? data : (data?.rows || data?.data || []);
            setEvents(arrayData);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [user?.UsuarioID, user?.SucursalID, searchFilters, viewMode]);

    useEffect(() => {
        fetchCalendarData(selectedDate);
    }, [selectedDate, viewMode, refreshTrigger, fetchCalendarData]);

    const processedData = useMemo(() => {
        const marks = {};
        const timelineForSelectedDay = [];

        events.forEach(event => {
            if (!event.startsAt || !event.endsAt) return;

            const startStr = event.startsAt.split('T')[0];
            const endStr = event.endsAt.split('T')[0];

            // 1. Mark ranges for month view
            const start = new Date(startStr);
            const end = new Date(endStr);
            const curr = new Date(start);

            while (curr <= end) {
                const dateKey = curr.toISOString().split('T')[0];
                if (!marks[dateKey]) {
                    marks[dateKey] = { marked: true, dots: [] };
                }
                if (!marks[dateKey].dots.some(d => d.key === String(event.CalendarioActividadID))) {
                    marks[dateKey].dots.push({
                        key: String(event.CalendarioActividadID),
                        color: event.color?.primary || '#337ab7',
                        selectedDotColor: '#fff'
                    });
                }

                // 2. Prepare timeline events for the currently SELECTED day
                if (dateKey === selectedDate) {
                    const startTimePart = event.startsAt.split('T')[1];
                    const endTimePart = event.endsAt.split('T')[1];

                    timelineForSelectedDay.push({
                        start: `${dateKey} ${startTimePart}`,
                        end: `${dateKey} ${endTimePart}`,
                        title: (event.title || '').replace(/<[^>]*>?/gm, ''),
                        summary: '',
                        color: event.color?.secondary || '#fae3e3',
                    });
                }
                curr.setDate(curr.getDate() + 1);
            }
        });

        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: '#337ab7'
        };

        return { marks, timelineForSelectedDay };
    }, [events, selectedDate]);

    const onEventPress = useCallback((event) => {
        const original = events.find(e => {
            const cleanTitle = (e.title || '').replace(/<[^>]*>?/gm, '');
            return cleanTitle.includes(event.title);
        });
        if (original) navigation.navigate('ActivityDetail', { activity: original });
    }, [events, navigation]);

    return (
        <CalendarProvider
            date={selectedDate}
            onDateChanged={setSelectedDate}
        >
            <View style={styles.container}>
                <View style={styles.selectorContainer}>
                    {['month', 'week'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.selectorItem, viewMode === mode && styles.selectorItemActive]}
                            onPress={() => setViewMode(mode)}
                        >
                            <Text style={[styles.selectorText, viewMode === mode && styles.selectorTextActive]}>
                                {mode === 'month' ? 'Mes' : 'Semana'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading && <ActivityIndicator style={styles.loader} size="large" color="#337ab7" />}

                {viewMode === 'month' ? (
                    <Calendar
                        current={selectedDate}
                        markedDates={processedData.marks}
                        markingType={'multi-dot'}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        onMonthChange={(month) => setSelectedDate(month.dateString)}
                        theme={{
                            todayTextColor: '#337ab7',
                            arrowColor: '#337ab7',
                            selectedDayBackgroundColor: '#337ab7',
                            textDayFontWeight: '400',
                            textMonthFontWeight: '700',
                        }}
                    />
                ) : (
                    <View style={{ flex: 1 }}>
                        <ExpandableCalendar
                            firstDay={1}
                            markedDates={processedData.marks}
                            theme={{
                                todayTextColor: '#337ab7',
                                selectedDayBackgroundColor: '#337ab7'
                            }}
                        />
                        <Timeline
                            key={`timeline-${selectedDate}`} // Force re-render on date change to ensure correct painters
                            date={selectedDate}
                            events={processedData.timelineForSelectedDay}
                            format24h={false}
                            start={7}
                            end={22}
                            onEventPress={onEventPress}
                            showNowIndicator
                            scrollToFirst
                            initialTime={{ hour: 8, minute: 0 }}
                            styles={{
                                container: { backgroundColor: '#fff' },
                                line: { backgroundColor: '#eee', height: 1 }
                            }}
                        />
                    </View>
                )}
            </View>
        </CalendarProvider>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    selectorContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee' },
    selectorItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
    selectorItemActive: { backgroundColor: '#337ab7' },
    selectorText: { fontSize: 14, fontWeight: '600', color: '#666' },
    selectorTextActive: { color: '#fff' },
    loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20, zIndex: 10 },
});

export default GestionComercialCalendar;
