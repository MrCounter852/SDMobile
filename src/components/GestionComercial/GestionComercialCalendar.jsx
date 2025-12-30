import React, { useState, useEffect, useMemo } from 'react';
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
    ExpandableCalendar
} from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useGlobal } from '../../core/global';
import GestionComercialService from '../../services/GestionComercial/gestionComercialService';

// Configure Spanish locale for calendars
LocaleConfig.locales['es'] = {
    monthNames: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const { width } = Dimensions.get('window');

const GestionComercialCalendar = ({ navigation, searchFilters, refreshTrigger }) => {
    const { user } = useGlobal();
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCalendarData = async (date) => {
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
                ModoCalendar: viewMode === 'week' ? 'WEEK' : (viewMode === 'day' ? 'DAY' : 'MONTH'),
            };

            if (viewMode === 'day') {
                filters.DiaCalendario = d.getDate();
            }

            const response = await GestionComercialService.consultarMiCalendario(filters);

            // The API returns a string that needs to be parsed if it's not already an object
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            setEvents(Array.isArray(parsedData) ? parsedData : []);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData(selectedDate);
    }, [selectedDate, viewMode, refreshTrigger, searchFilters]);

    const markedDates = useMemo(() => {
        const marks = {};
        events.forEach(event => {
            if (!event.startsAt) return;
            const dateKey = event.startsAt.split('T')[0];
            if (!marks[dateKey]) {
                marks[dateKey] = { marked: true, dots: [] };
            }
            marks[dateKey].dots.push({
                key: event.CalendarioActividadID.toString(),
                color: event.color?.primary || '#337ab7',
                selectedDotColor: '#fff'
            });
        });

        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: '#337ab7'
        };

        return marks;
    }, [events, selectedDate]);

    const timelineEvents = useMemo(() => {
        return events.map(event => ({
            start: event.startsAt.replace('T', ' '),
            end: event.endsAt.replace('T', ' '),
            title: event.title.replace(/<[^>]*>?/gm, ''), // Remove HTML tags
            summary: '',
            color: event.color?.secondary || '#fae3e3',
        }));
    }, [events]);

    const onDateChanged = (date) => {
        setSelectedDate(date);
    };

    const renderViewSelector = () => (
        <View style={styles.selectorContainer}>
            <TouchableOpacity
                style={[styles.selectorItem, viewMode === 'month' && styles.selectorItemActive]}
                onPress={() => setViewMode('month')}
            >
                <Text style={[styles.selectorText, viewMode === 'month' && styles.selectorTextActive]}>Mes</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.selectorItem, viewMode === 'week' && styles.selectorItemActive]}
                onPress={() => setViewMode('week')}
            >
                <Text style={[styles.selectorText, viewMode === 'week' && styles.selectorTextActive]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.selectorItem, viewMode === 'day' && styles.selectorItemActive]}
                onPress={() => setViewMode('day')}
            >
                <Text style={[styles.selectorText, viewMode === 'day' && styles.selectorTextActive]}>Día</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <CalendarProvider
            date={selectedDate}
            onDateChanged={onDateChanged}
            theme={{ todayButtonTextColor: '#337ab7' }}
        >
            <View style={styles.container}>
                {renderViewSelector()}

                {loading && <ActivityIndicator style={styles.loader} size="large" color="#337ab7" />}

                {viewMode === 'month' ? (
                    <Calendar
                        current={selectedDate}
                        markedDates={markedDates}
                        markingType={'multi-dot'}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        theme={{
                            todayTextColor: '#337ab7',
                            arrowColor: '#337ab7',
                            indicatorColor: '#337ab7',
                            textDayFontWeight: '400',
                            textMonthFontWeight: '700',
                            textDayHeaderFontWeight: '600',
                        }}
                    />
                ) : (
                    <View style={{ flex: 1 }}>
                        {viewMode === 'week' && (
                            <ExpandableCalendar
                                firstDay={1}
                                markedDates={markedDates}
                                theme={{
                                    todayTextColor: '#337ab7',
                                    selectedDayBackgroundColor: '#337ab7',
                                }}
                            />
                        )}
                        <Timeline
                            format24h={false}
                            events={timelineEvents}
                            start={8}
                            end={22}
                            onEventPress={(event) => {
                                const originalEvent = events.find(e => e.title.includes(event.title));
                                if (originalEvent) {
                                    navigation.navigate('ActivityDetail', { activity: originalEvent });
                                }
                            }}
                            styles={{
                                line: { backgroundColor: '#eee', height: 1 },
                                timeLabel: { color: '#666', fontSize: 10 },
                            }}
                        />
                    </View>
                )}
            </View>
        </CalendarProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    selectorContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectorItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
    },
    selectorItemActive: {
        backgroundColor: '#337ab7',
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    selectorTextActive: {
        color: '#fff',
    },
    loader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -20,
        zIndex: 10,
    },
});

export default GestionComercialCalendar;
