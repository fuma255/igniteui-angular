import { CommonModule, formatDate } from '@angular/common';
import {
    Component,
    ContentChild,
    EventEmitter,
    HostBinding,
    Input,
    NgModule,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ElementRef,
    TemplateRef,
    Inject,
    ChangeDetectorRef,
    HostListener,
    NgModuleRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    IgxCalendarComponent,
    IgxCalendarHeaderTemplateDirective,
    IgxCalendarModule,
    IgxCalendarSubheaderTemplateDirective,
    WEEKDAYS,
    isDateInRanges
} from '../calendar/index';
import { IgxIconModule } from '../icon/index';
import { IgxInputGroupModule, IgxInputDirective } from '../input-group/index';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { IgxOverlayOutletDirective } from '../directives/toggle/toggle.directive';
import {
    OverlaySettings,
    IgxOverlayService,
    VerticalAlignment,
    HorizontalAlignment,
    PositionSettings,
    ConnectedPositioningStrategy,
    AbsoluteScrollStrategy
} from '../services/index';
import { DateRangeDescriptor } from '../core/dates/dateRange';
import { EditorProvider } from '../core/edit-provider';
import { IgxButtonModule } from '../directives/button/button.directive';
import { IgxRippleModule } from '../directives/ripple/ripple.directive';
import { IgxMaskModule } from '../directives/mask/mask.directive';
import {
    DatePickerUtil,
    DateState
} from './date-picker.utils';
import { DatePickerDisplayValuePipe, DatePickerInputValuePipe } from './date-picker.pipes';
import { IDatePicker } from './date-picker.common';
import { KEYS } from '../core/utils';
import { IgxDatePickerTemplateDirective } from './date-picker.directives';
import { IgxCalendarContainerComponent } from './calendar-container.component';
import { InteractionMode } from '../core/enums';

let NEXT_ID = 0;

/**
 * This interface is used to provide information about date picker reference and its current value
 * when onDisabledDate event is fired.
 */
export interface IDatePickerDisabledDateEventArgs {
    datePicker: IgxDatePickerComponent;
    currentValue: Date;
}

/**
 * This interface is used to provide information about date picker reference and its previously valid value
 * when onValidationFailed event is fired.
 */
export interface IDatePickerValidationFailedEventArgs {
    datePicker: IgxDatePickerComponent;
    prevValue: Date;
}

/**
 * This interface is used to configure calendar format view options.
 */
export interface IFormatViews {
    day?: boolean;
    month?: boolean;
    year?: boolean;
}

/**
 * This interface is used to configure calendar format options.
 */
export interface IFormatOptions {
    day?: string;
    month?: string;
    weekday?: string;
    year?: string;
}

/**
 * This enumeration is used to configure the date picker to operate with pre-defined format option used in Angular DatePipe.
 * 'https://angular.io/api/common/DatePipe'
 * 'shortDate': equivalent to 'M/d/yy' (6/15/15).
 * 'mediumDate': equivalent to 'MMM d, y' (Jun 15, 2015).
 * 'longDate': equivalent to 'MMMM d, y' (June 15, 2015).
 * 'fullDate': equivalent to 'EEEE, MMMM d, y' (Monday, June 15, 2015).
 */
export const enum PredefinedFormatOptions {
    ShortDate = 'shortDate',
    MediumDate = 'mediumDate',
    LongDate = 'longDate',
    FullDate = 'fullDate'
}

/**
 * **Ignite UI for Angular Date Picker** -
 * [Documentation](https://www.infragistics.com/products/ignite-ui-angular/angular/components/date_picker.html)
 *
 * The Ignite UI Date Picker displays a popup calendar that lets users select a single date.
 *
 * Example:
 * ```html
 * <igx-date-picker [(ngModel)]="selectedDate"></igx-date-picker>
 * ```
 */
@Component({
    providers:
        [{
            provide: NG_VALUE_ACCESSOR,
            useExisting: IgxDatePickerComponent,
            multi: true
        }],
    // tslint:disable-next-line:component-selector
    selector: 'igx-date-picker',
    templateUrl: 'date-picker.component.html'
})
export class IgxDatePickerComponent implements IDatePicker, ControlValueAccessor, EditorProvider, OnInit, OnDestroy {
    /**
     * An @Input property that sets the `IgxDatePickerComponent` label.
     * The default label is 'Date'.
     * ```html
     * <igx-date-picker [label]="Calendar"></igx-date-picker>
     * ```
     */
    @Input()
    public label = 'Date';

    /**
     * An @Input property that sets the `IgxDatePickerComponent` label visibility.
     * By default the visibility is set to true.
     * <igx-date-picker [labelVisibility]="false"></igx-date-picker>
     */
    @Input()
    public labelVisibility = true;

    /**
     *An @Input property that sets locales. Default locale is en.
     *```html
     *<igx-date-picker locale="ja-JP" [value]="date"></igx-date-picker>
     *```
     */
    @Input() public locale: 'en';

    /**
     *An @Input property that sets on which day the week starts.
     *```html
     *<igx-date-picker [weekStart]="WEEKDAYS.FRIDAY" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    @Input() public weekStart: WEEKDAYS | number = WEEKDAYS.SUNDAY;

    /**
     *Returns the format options of the `IgxDatePickerComponent`.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    let formatOptions = this.datePicker.formatOptions;
     *}
     *```
     */
    @Input()
    public get formatOptions(): IFormatOptions {
        return this._formatOptions;
    }

    /**
     *Sets the format options of the `IgxDatePickerComponent`.
     *```typescript
     *public Options;
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    this.Options = {
     *        day: "numeric",
     *        month: "long",
     *        weekday: "long",
     *        year: "numeric"
     *    }
     *this.datePicker.formatOptions = this.Options;
     *}
     *```
     */
    public set formatOptions(formatOptions: IFormatOptions) {
        this._formatOptions = Object.assign(this._formatOptions, formatOptions);
    }

    /**
     *Returns the date display format of the `IgxDatePickerComponent` in dropdown mode.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    let format = this.datePicker.format;
     *}
     *```
     */
    @Input()
    public get format(): string {
        return (this._format === undefined) ? PredefinedFormatOptions.ShortDate : this._format;
    }

    /**
    *Sets the date format of the `IgxDatePickerComponent` when in editable dropdown mode.
    *```typescript
    *@ViewChild("MyDatePicker")
    *public datePicker: IgxDatePickerComponent;
    *this.datePicker.format = 'yyyy-M-d';
    *}
    *```
    */
    public set format(format: string) {
        this._format = format;
    }

    /**
     *Returns the date mask of the `IgxDatePickerComponent` when in editable dropdown mode.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    let mask = this.datePicker.mask;
     *}
     *```
     */
    @Input()
    public mask: string;

    /**
     *Returns the format views of the `IgxDatePickerComponent`.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    let formatViews = this.datePicker.formatViews;
     *}
     *```
     */
    @Input()
    public get formatViews(): IFormatViews {
        return this._formatViews;
    }

    /**
     *Sets the format views of the `IgxDatePickerComponent`.
     *```typescript
     *public Views;
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    this.Views = {day:false, month: false, year:false};
     *    this.datePicker.formatViews = this.Views;
     *}
     *```
     */
    public set formatViews(formatViews: IFormatViews) {
        this._formatViews = Object.assign(this._formatViews, formatViews);
    }

    /**
     * Gets the disabled dates descriptors.
     * ```typescript
     * let disabledDates = this.datepicker.disabledDates;
     * ```
     */
    @Input()
    public get disabledDates(): DateRangeDescriptor[] {
        return this._disabledDates;
    }

    /**
     * Sets the disabled dates' descriptors.
     * ```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    this.datePicker.disabledDates = [
     *     {type: DateRangeType.Between, dateRange: [new Date("2020-1-1"), new Date("2020-1-15")]},
     *     {type: DateRangeType.Weekends}];
     *}
     *```
     */
    public set disabledDates(value: DateRangeDescriptor[]) {
        this._disabledDates = value;
    }

    /**
     * Gets the special dates descriptors.
     * ```typescript
     * let specialDates = this.datepicker.specialDates;
     * ```
     */
    @Input()
    public get specialDates(): DateRangeDescriptor[] {
        return this._specialDates;
    }

    /**
     * Sets the special dates' descriptors.
     * ```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    this.datePicker.specialDates = [
     *     {type: DateRangeType.Between, dateRange: [new Date("2020-1-1"), new Date("2020-1-15")]},
     *     {type: DateRangeType.Weekends}];
     *}
     *```
     */
    public set specialDates(value: DateRangeDescriptor[]) {
        this._specialDates = value;
    }

    @Input()
    public get modalOverlaySettings(): OverlaySettings {
        return this._modalOverlay;
    }

    public set modalOverlaySettings(value: OverlaySettings) {
        this._modalOverlay = value;
    }

    @Input()
    public get dropDownOverlaySettings(): OverlaySettings {
        return this._dropDownOverlay;
    }

    public set dropDownOverlaySettings(value: OverlaySettings) {
        this._dropDownOverlay = value;
    }

    /**
     *Returns the formatted date when `IgxDatePickerComponent` is in dialog mode.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *public selection(event){
     *    let selectedDate = this.datePicker.displayData;
     *    alert(selectedDate);
     *}
     *```
     *```html
     *<igx-date-picker #MyDatePicker (onSelection)="selection()" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    public get displayData(): string {
        if (this.value) {
            return this._customFormatChecker(this.formatter, this.value);
        }
        return '';
    }

    /**
     hidden
     */
    public get transformedDate(): string {
        if (this._value) {
            this._transformedDate = (this._isInEditMode) ? this._getEditorDate(this._value) : this._getDisplayDate(this._value);
            this.isEmpty = false;
        } else {
            this._transformedDate = (this._isInEditMode) ? DatePickerUtil.maskToPromptChars(this.inputMask) : '';
        }
        return this._transformedDate;
    }

    public set transformedDate(value) {
        this._transformedDate = value;
    }

    constructor(@Inject(IgxOverlayService) private _overlayService: IgxOverlayService, public element: ElementRef,
        private _cdr: ChangeDetectorRef, private _moduleRef: NgModuleRef<any>) { }

    /**
     * Gets the input group template.
     * ```typescript
     * let template = this.template();
     * ```
     * @memberof IgxDatePickerComponent
     */
    get template(): TemplateRef<any> {
        if (this.datePickerTemplateDirective) {
            return this.datePickerTemplateDirective.template;
        }
        return (this.mode === InteractionMode.Dialog) ? this.readOnlyDatePickerTemplate : this.editableDatePickerTemplate;
    }

    /**
     * Gets the context passed to the input group template.
     * @memberof IgxDatePickerComponent
     */
    get context() {
        return {
            disabled: this.disabled,
            disabledDates: this.disabledDates,
            displayData: this.displayData,
            format: this.format,
            isSpinLoop: this.isSpinLoop,
            label: this.label,
            labelVisibility: this.labelVisibility,
            locale: this.locale,
            mask: this.mask,
            mode: this.mode,
            specialDates: this.specialDates,
            value: this.value,
            openDialog: () => { this.openDialog(); }
        };
    }

    /**
     *An @Input property that gets/sets the selected date.
     *```typescript
     *public date: Date = new Date();
     *```
     *```html
     *<igx-date-picker [value]="date"></igx-date-picker>
     *```
     */
    @Input()
    public get value(): Date {
        return this._value;
    }

    public set value(date: Date) {
        this._value = date;
        this._onChangeCallback(date);
    }

    /**
     *An @Input property that sets the value of `id` attribute. If not provided it will be automatically generated.
     *```html
     *<igx-date-picker [id]="'igx-date-picker-3'" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    @HostBinding('attr.id')
    @Input()
    public id = `igx-date-picker-${NEXT_ID++}`;

    /**
     *An @Input property that applies a custom formatter function on the selected or passed date.
     *```typescript
     *public date: Date = new Date();
     *private dayFormatter = new Intl.DateTimeFormat("en", { weekday: "long" });
     *private monthFormatter = new Intl.DateTimeFormat("en", { month: "long" });
     *public formatter = (date: Date) => { return `You selected
     *                     ${this.dayFormatter.format(date)},
     *                     ${date.getDate()} ${this.monthFormatter.format(date)},
     *                     ${date.getFullYear()}`;
     *}
     *```
     *```html
     *<igx-date-picker [value]="date" [formatter]="formatter"></igx-date-picker>
     *```
     */
    @Input()
    public formatter: (val: Date) => string;

    /**
     *An @Input property that disables the `IgxDatePickerComponent`.
     *```html
     *<igx-date-picker [disabled]="'true'" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     * ```
     */
    @Input()
    public disabled: boolean;

    /**
     *An @Input property that sets the orientation of the `IgxDatePickerComponent` header.
     *```html
     *<igx-date-picker [vertical]="'true'" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    @Input()
    public vertical = false;

    /**
     *An @Input property that renders today button with custom label.
     *```html
     *<igx-date-picker cancelButtonLabel="cancel" todayButtonLabel="Tomorrow"></igx-date-picker>
     *```
     */
    @Input()
    public todayButtonLabel: string;

    /**
     *An @Input property that renders cancel button with custom label.
     *```html
     *<igx-date-picker cancelButtonLabel="Close" todayButtonLabel="Today"></igx-date-picker>
     *```
     */
    @Input()
    public cancelButtonLabel: string;

    /**
     *An @Input property that sets whether `IgxDatePickerComponent` is in dialog or drop down mode.
     *```html
     *<igx-date-picker mode="dropdown"></igx-date-picker>
     *```
     */
    @Input()
    public mode = InteractionMode.Dialog;

    /**
     *An @Input property that sets whether the `IgxDatePickerComponent` date parts would spin continuously or stop when min/max is reached.
     *```html
     *<igx-date-picker [isSpinLoop]="false"></igx-date-picker>
     *```
     */
    @Input()
    public isSpinLoop = true;

    /**
    *@hidden
    */
    @Input()
    public outlet: IgxOverlayOutletDirective | ElementRef;

    /**
     *An event that is emitted when the `IgxDatePickerComponent` calendar is opened.
     *```typescript
     *public open(event){
     *    alert("The date-picker calendar has been opened!");
     *}
     *```
     *```html
     *<igx-date-picker (onOpen)="open($event)" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    @Output()
    public onOpen = new EventEmitter<IgxDatePickerComponent>();

    /**
     *"An event that is emitted when the `IgxDatePickerComponent` is closed.
     *```typescript
     *public close(event){
     *    alert("The date-picker has been closed!");
     *}
     *```
     *```html
     *<igx-date-picker (onClose)="close($event)" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    @Output()
    public onClose = new EventEmitter<IgxDatePickerComponent>();
    /**
     *An @Output property that is fired when selection is made in the calendar.
     *```typescript
     *public selection(event){
     *    alert("A date has been selected!");
     *}
     *```
     *```html
     *<igx-date-picker (onSelection)="selection($event)" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     *```
     */
    @Output()
    public onSelection = new EventEmitter<Date>();

    /**
    *An @Output property that fires when the user types/spins to a disabled date in the date-picker editor.
    *```typescript
    *public onDisabledDate(event){
    *    alert("This date is disabled!");
    *}
    *```
    *```html
    *<igx-date-picker (onDisabledDate)="onDisabledDate($event)"></igx-date-picker>
    *```
    */
    @Output()
    public onDisabledDate = new EventEmitter<IDatePickerDisabledDateEventArgs>();

    /**
    *An @Output property that fires when the user types/spins invalid date in the date-picker editor.
    *```typescript
    *public onValidationFailed(event){
        *    alert("This date is not valid!");
        *}
        *```
        *```html
        *<igx-date-picker (onValidationFailed)="onValidationFailed($event)"></igx-date-picker>
        *```
        */
    @Output()
    public onValidationFailed = new EventEmitter<IDatePickerValidationFailedEventArgs>();

    /**
    * @hidden
    */
    @ViewChild('datePickerOutlet', { read: ElementRef })
    public outletDirective: ElementRef;

    /*
     * @hidden
     */
    @ViewChild('readOnlyDatePickerTemplate', { read: TemplateRef })
    protected readOnlyDatePickerTemplate: TemplateRef<any>;

    /*
     * @hidden
     */
    @ViewChild('editableDatePickerTemplate', { read: TemplateRef })
    protected editableDatePickerTemplate: TemplateRef<any>;

    /*
     * @hidden
     */
    @ViewChild('editableInputGroup', { read: ElementRef })
    protected editableInputGroup: ElementRef;

    /*
     * @hidden
     */
    @ContentChild('dropDownTarget', { read: ElementRef })
    protected templateDropDownTarget: ElementRef;

    /*
     * @hidden
     */
    @ViewChild('editableInput', { read: ElementRef })
    protected editableInput: ElementRef;

    /*
    * @hidden
    */
    @ViewChild('readonlyInput', { read: ElementRef })
    protected readonlyInput: ElementRef;

    /*
    * @hidden
    */
    @ContentChild(IgxInputDirective)
    protected input: IgxInputDirective;

    /**
     *@hidden
     */
    @ContentChild(IgxDatePickerTemplateDirective, { read: IgxDatePickerTemplateDirective })
    protected datePickerTemplateDirective: IgxDatePickerTemplateDirective;

    /**
     *@hidden
     */
    @ContentChild(IgxCalendarHeaderTemplateDirective, { read: IgxCalendarHeaderTemplateDirective })
    public headerTemplate: IgxCalendarHeaderTemplateDirective;

    /**
     *@hidden
     */
    @ContentChild(IgxCalendarSubheaderTemplateDirective, { read: IgxCalendarSubheaderTemplateDirective })
    public subheaderTemplate: IgxCalendarSubheaderTemplateDirective;

    public calendar: IgxCalendarComponent;
    public hasHeader = true;
    public collapsed = true;
    public displayValuePipe = new DatePickerDisplayValuePipe(this);
    public inputValuePipe = new DatePickerInputValuePipe(this);
    public dateFormatParts = [];
    public rawDateString: string;
    public inputMask: string;
    public isEmpty = true;
    public invalidDate = '';

    private readonly SPIN_DELTA = 1;
    private readonly DEFAULT_LOCALE = 'en';

    private _formatOptions = {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
        year: 'numeric'
    };
    private _formatViews = {
        day: false,
        month: true,
        year: false
    };
    private _destroy$ = new Subject<boolean>();
    private _componentID: string;
    private _format: string;
    private _value: Date;
    private _isInEditMode: boolean;
    private _disabledDates: DateRangeDescriptor[] = null;
    private _specialDates: DateRangeDescriptor[] = null;
    private _modalOverlay: OverlaySettings;
    private _dropDownOverlay: OverlaySettings;
    private _positionSettings: PositionSettings;
    private _dropDownOverlaySettings: OverlaySettings;
    private _modalOverlaySettings: OverlaySettings;
    private _transformedDate;

    /**
    * @hidden
    */
    @HostListener('keydown.spacebar', ['$event'])
    @HostListener('keydown.space', ['$event'])
    public onSpaceClick(event: KeyboardEvent) {
        this.openDialog();
        event.preventDefault();
    }

    /**
     *Method that sets the selected date.
     *```typescript
     *public date = new Date();
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *    this.datePicker.writeValue(this.date);
     *}
     *```
     *@param value The date you want to select.
     *@memberOf {@link IgxDatePickerComponent}
     */
    public writeValue(value: Date) {
        this.value = value;
        this._cdr.markForCheck();
    }

    /**
     *@hidden
     */
    public registerOnChange(fn: (_: Date) => void) { this._onChangeCallback = fn; }

    /**
     *@hidden
     */
    public registerOnTouched(fn: () => void) { this._onTouchedCallback = fn; }

    /** @hidden */
    public getEditElement() {
        let inputElement;
        if (this.mode === InteractionMode.DropDown) {
            inputElement = (this.editableInput) ? this.editableInput : this.input;
        } else {
            inputElement = (this.readonlyInput) ? this.readonlyInput : this.input;
        }
        return (inputElement) ? inputElement.nativeElement : null;
    }

    /**
     *@hidden
     */
    public ngOnInit(): void {
        this._positionSettings = {
            horizontalDirection: HorizontalAlignment.Right,
            verticalDirection: VerticalAlignment.Bottom,
        };

        const outlet = (this.outlet !== undefined) ? this.outlet : this.outletDirective;
        this._dropDownOverlaySettings = {
            closeOnOutsideClick: true,
            modal: false,
            scrollStrategy: new AbsoluteScrollStrategy(),
            positionStrategy: new ConnectedPositioningStrategy(this._positionSettings),
            outlet: outlet
        };

        this._modalOverlaySettings = {
            closeOnOutsideClick: true,
            modal: true,
            outlet: outlet
        };

        this._overlayService.onOpening.pipe(
            filter((overlay) => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe((eventArgs) => {
                this._onOpening(eventArgs);
            });

        this._overlayService.onOpened.pipe(
            filter((overlay) => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe((eventArgs) => {
                this._onOpened(eventArgs);
            });

        this._overlayService.onClosed.pipe(
            filter(overlay => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe(() => {
                this._onClosed();
            });

        if (this.mode === InteractionMode.DropDown) {
            this.dateFormatParts = DatePickerUtil.parseDateFormat(this.mask, this.locale);
            if (this.mask === undefined) {
                this.mask = DatePickerUtil.getMask(this.dateFormatParts);
            }
            this.inputMask = DatePickerUtil.getInputMask(this.dateFormatParts);
        }
    }

    /**
     *@hidden
     */
    public ngOnDestroy(): void {
        if (this._componentID) {
            this._overlayService.hide(this._componentID);
        }
        this._destroy$.next(true);
        this._destroy$.complete();
    }

    /**
     *Selects today's date from calendar and change the input field value, @calendar.viewDate and @calendar.value.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *this.datePicker.triggerTodaySelection();
     *}
     *```
     *@memberOf {@link IgxDatePickerComponent}
     */
    public triggerTodaySelection(): void {
        const today = new Date(Date.now());
        this.handleSelection(today);
    }

    /**
     * Change the calendar selection and calling this method will emit the @calendar.onSelection event,
     * which will fire @handleSelection method.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *this.datePicker.selectDate(this.date);
     *}
     * ```
     * @param date passed date that has to be set to the calendar.
     * @memberOf {@link IgxDatePickerComponent}
     */
    public selectDate(date: Date): void {
        this.value = date;
        this.onSelection.emit(date);
        this._onChangeCallback(date);
    }

    /**
     * Deselects the calendar date.
     *```typescript
     *@ViewChild("MyDatePicker")
     *public datePicker: IgxDatePickerComponent;
     *ngAfterViewInit(){
     *this.datePicker.deselectDate();
     *}
     * ```
     * @memberOf {@link IgxDatePickerComponent}
     */
    public deselectDate(): void {
        this.value = null;
        if (this.calendar) {
            this.calendar.deselectDate();
        }
        this._onChangeCallback(null);
    }

    /**
     * Open the calendar.
     *
     * @hidden
     */
    public openDialog(): void {
        if (!this.collapsed) {
            return;
        }
        switch (this.mode) {
            case InteractionMode.Dialog: {
                this.hasHeader = true;
                const modalOverlay = (this.modalOverlaySettings !== undefined) ? this._modalOverlay : this._modalOverlaySettings;
                this._componentID = this._overlayService.attach(IgxCalendarContainerComponent, modalOverlay, this._moduleRef);
                this._overlayService.show(this._componentID, modalOverlay);
                break;
            }
            case InteractionMode.DropDown: {
                this.hasHeader = false;
                const dropDownOverlay =
                    (this.dropDownOverlaySettings !== undefined) ? this._dropDownOverlay : this._dropDownOverlaySettings;
                if (this.editableInputGroup) {
                    dropDownOverlay.positionStrategy.settings.target = this.editableInputGroup.nativeElement;
                } else {
                    try {
                        // if the date picker is retemplated, set an element marked with #dropDownTarget as a target to the drop-down
                        dropDownOverlay.positionStrategy.settings.target = this.templateDropDownTarget.nativeElement;
                    } catch {
                        throw new Error('There is no target element for the dropdown to attach. Mark an element with #dropDownTarget.');
                    }
                }

                this._componentID = this._overlayService.attach(IgxCalendarContainerComponent, dropDownOverlay, this._moduleRef);
                this._overlayService.show(this._componentID, dropDownOverlay);
                break;
            }
        }
    }

    /**
     * Close the calendar.
     *
     * @hidden
     */
    public closeCalendar(): void {
        this._overlayService.hide(this._componentID);
    }

    /**
     * Clear the input field, date picker value and calendar selection.
     *
     * @hidden
     */
    public clear(): void {
        this.isEmpty = true;
        this.invalidDate = '';
        this.deselectDate();
        this._setCursorPosition(0);
    }

    /**
     * Evaluates when @calendar.onSelection event was fired
     * and update the input value.
     *
     * @param event selected value from calendar.
     *
     * @hidden
     */
    public handleSelection(date: Date): void {
        if (this.value) {
            date.setHours(this.value.getHours());
            date.setMinutes(this.value.getMinutes());
            date.setSeconds(this.value.getSeconds());
            date.setMilliseconds(this.value.getMilliseconds());
        }

        this.value = date;
        this.calendar.viewDate = date;
        this._onChangeCallback(date);
        this.closeCalendar();
        this.onSelection.emit(date);
    }

    /**
    * Evaluates when the input blur event was fired
    * and re-calculate the date picker value.
    *
    * @param event
    *
    * @hidden
    */
    public onBlur(event): void {
        this._isInEditMode = false;
        this.calculateDate(event.target.value, event.type);
    }

    /**
    * Evaluates when the input focus event was fired
    * and re-calculate the editor text.
    *
    * @param event
    * @hidden
    */
    public onFocus(): void {
        this._isInEditMode = true;
        if (this.value && this.invalidDate === '') {
            this._transformedDate = this._getEditorDate(this.value);
        }
    }

    /**
    * Evaluates when the keydown event was fired for up/down keys
    * to provide spinning of date parts.
    *
    * @param event
    *
    * @hidden
    */
    public onKeyDown(event) {
        switch (event.key) {
            case KEYS.UP_ARROW:
            case KEYS.UP_ARROW_IE:
                event.preventDefault();
                event.stopPropagation();
                this.spinValue(event.target.value, 1, event.type);
                break;
            case KEYS.DOWN_ARROW:
            case KEYS.DOWN_ARROW_IE:
                if (event.altKey) {
                    this.openDialog();
                } else {
                    event.preventDefault();
                    event.stopPropagation();
                    this.spinValue(event.target.value, -1, event.type);
                }
                break;
            default:
                break;
        }
    }

    /**
    * Evaluates when the mouse wheel event was fired
    * to provide spinning of date parts.
    *
    * @param event
    *
    * @hidden
    */
    public onWheel(event) {
        if (this._isInEditMode) {
            event.preventDefault();
            event.stopPropagation();
            const sign = (event.deltaY > 0) ? -1 : 1;
            this.spinValue(event.target.value, sign, event.type);
        }
    }

    /**
    * Evaluates when input event was fired in editor.
    *
    * @param event
    *
    * @hidden
    */
    public onInput(event) {
        const targetValue = event.target.value;
        const cursorPosition = this._getCursorPosition();
        const checkInput = DatePickerUtil.checkForCompleteDateInput(this.dateFormatParts, targetValue);
        this._isInEditMode = true;

        if (targetValue !== DatePickerUtil.maskToPromptChars(this.inputMask)) {
            this.isEmpty = false;
        }

        // If all date parts are completed, change the date-picker value, stay in edit mode
        if (checkInput === 'complete' && event.inputType !== 'deleteContentBackward') {
            this._transformedDate = targetValue;
            this.calculateDate(targetValue, event.type);
            this._setCursorPosition(cursorPosition);
        } else if (checkInput === 'partial') {
            // While editing, if one date part is deleted, date-picker value is set to null, the remaining input stays intact.
            this.deselectDate();
            requestAnimationFrame(() => {
                this.getEditElement().value = targetValue;
                this._setCursorPosition(cursorPosition);
            });
        } else if (checkInput === 'empty') {
            // Total clean-up as input is deleted.
            this.isEmpty = true;
            this.deselectDate();
        }
    }

    private calculateDate(dateString: string, invokedByEvent: string): void {
        if (dateString !== '') {
            const prevDateValue = this.value;
            const inputValue = (invokedByEvent === 'blur') ? this.rawDateString : dateString;
            const newDateArray = DatePickerUtil.parseDateArray(this.dateFormatParts, prevDateValue, inputValue);

            if (newDateArray.state === DateState.Valid) {
                const newValue = newDateArray.date;
                // Restore the time part if any
                if (prevDateValue) {
                    newValue.setHours(prevDateValue.getHours());
                    newValue.setMinutes(prevDateValue.getMinutes());
                    newValue.setSeconds(prevDateValue.getSeconds());
                    newValue.setMilliseconds(prevDateValue.getMilliseconds());
                }

                if (this.disabledDates === null
                    || (this.disabledDates !== null && !isDateInRanges(newValue, this.disabledDates))) {
                    this.value = newValue;
                    this.invalidDate = '';
                    this._onChangeCallback(newValue);
                } else {
                    const args: IDatePickerDisabledDateEventArgs = {
                        datePicker: this,
                        currentValue: newValue,
                    };
                    this.onDisabledDate.emit(args);
                }
            } else {
                const args: IDatePickerValidationFailedEventArgs = {
                    datePicker: this,
                    prevValue: prevDateValue
                };
                this.invalidDate = dateString;
                this.onValidationFailed.emit(args);
            }
        }
    }

    private spinValue(inputValue: string, sign: number, eventType: string): void {
        this._isInEditMode = true;
        this.isEmpty = false;
        const cursorPosition = this._getCursorPosition();

        const modifiedInputValue =
            DatePickerUtil.getModifiedDateInput(this.dateFormatParts, inputValue, cursorPosition, this.SPIN_DELTA * sign, this.isSpinLoop);

        this.getEditElement().value = modifiedInputValue;
        this._setCursorPosition(cursorPosition);

        const checkInput = DatePickerUtil.checkForCompleteDateInput(this.dateFormatParts, modifiedInputValue);
        if (checkInput === 'complete') {
            this._isInEditMode = true;
            this.calculateDate(modifiedInputValue, eventType);
            this._setCursorPosition(cursorPosition);
        }
    }

    private _onOpening(event) {
        this._initializeCalendarContainer(event.componentRef.instance);
        this.collapsed = false;
    }

    private _onOpened(event): void {
        this._onTouchedCallback();
        this.onOpen.emit(this);

        if (this.calendar) {
            this._focusCalendarDate();
        }
    }

    private _onClosed(): void {
        this.collapsed = true;
        this._componentID = null;
        this.onClose.emit(this);

        if (this.getEditElement()) {
            this.getEditElement().focus();
        }
    }

    private _initializeCalendarContainer(componentInstance: IgxCalendarContainerComponent) {
        this.calendar = componentInstance.calendar;
        const isVertical = (this.vertical && this.mode === InteractionMode.Dialog);
        this.calendar.hasHeader = this.hasHeader;
        this.calendar.formatOptions = this.formatOptions;
        this.calendar.formatViews = this.formatViews;
        this.calendar.locale = this.locale;
        this.calendar.vertical = isVertical;
        this.calendar.weekStart = this.weekStart;
        this.calendar.specialDates = this.specialDates;
        this.calendar.disabledDates = this.disabledDates;
        this.calendar.headerTemplate = this.headerTemplate;
        this.calendar.subheaderTemplate = this.subheaderTemplate;
        this.calendar.onSelection.pipe(takeUntil(this._destroy$)).subscribe((ev: Date) => this.handleSelection(ev));

        if (this.value) {
            this.calendar.value = this.value;
            this.calendar.viewDate = this.value;
        }

        componentInstance.mode = this.mode;
        componentInstance.vertical = isVertical;
        componentInstance.cancelButtonLabel = this.cancelButtonLabel;
        componentInstance.todayButtonLabel = this.todayButtonLabel;

        componentInstance.onClose.pipe(takeUntil(this._destroy$)).subscribe(() => this.closeCalendar());
        componentInstance.onTodaySelection.pipe(takeUntil(this._destroy$)).subscribe(() => this.triggerTodaySelection());
    }

    // Focus a date, after the calendar appearance into DOM.
    private _focusCalendarDate(): void {
        requestAnimationFrame(() => {
            this.calendar.daysView.focusActiveDate();
        });
    }

    private _setLocaleToDate(value: Date): string {
        return value.toLocaleDateString(this.locale);
    }

    private _getCursorPosition(): number {
        return this.getEditElement().selectionStart;
    }

    private _setCursorPosition(start: number, end: number = start): void {
        requestAnimationFrame(() => {
            this.getEditElement().setSelectionRange(start, end);
        });
    }

    /**
     * Apply custom user formatter upon date.
     * @param formatter custom formatter function.
     * @param date passed date
     */
    private _customFormatChecker(formatter: (_: Date) => string, date: Date) {
        return this.formatter ? this.formatter(date) : this._setLocaleToDate(date);
    }

    /*
    * Transforms the date according to the specified format when `IgxDatePickerComponent` is in edit mode
    * using @angular/common formatDate method: https://angular.io/api/common/formatDate
    * @param  value: string | number | Date
    * @returns formatted string
    */
    private _getDisplayDate(value: any): string {
        if (this.format && !this.formatter) {
            const locale = this.locale || this.DEFAULT_LOCALE;
            return formatDate(value, this.format, locale);
        } else {
            return this._customFormatChecker(this.formatter, value);
        }
    }

    private _getEditorDate(value: any) {
        const locale = this.locale || this.DEFAULT_LOCALE;
        const changedValue = (value) ? formatDate(value, this.mask, locale) : '';
        return DatePickerUtil.addPromptCharsEditMode(this.dateFormatParts, this.value, changedValue);
    }

    private _onTouchedCallback: () => void = () => { };

    private _onChangeCallback: (_: Date) => void = () => { };
}

/**
 * @hidden
 */
@NgModule({
    declarations: [IgxDatePickerComponent, IgxCalendarContainerComponent,
        IgxDatePickerTemplateDirective, DatePickerDisplayValuePipe, DatePickerInputValuePipe],
    exports: [IgxDatePickerComponent, IgxDatePickerTemplateDirective, DatePickerDisplayValuePipe, DatePickerInputValuePipe],
    imports: [CommonModule, IgxIconModule, IgxInputGroupModule, IgxCalendarModule, IgxButtonModule, IgxRippleModule, IgxMaskModule],
    entryComponents: [IgxCalendarContainerComponent]
})
export class IgxDatePickerModule { }
