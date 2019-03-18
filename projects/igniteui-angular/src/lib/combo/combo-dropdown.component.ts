import {
    ChangeDetectorRef, Component, ContentChild, ElementRef, forwardRef, Inject, QueryList, OnDestroy, AfterViewInit, ContentChildren
} from '@angular/core';
import { takeUntil, take } from 'rxjs/operators';
import { IgxForOfDirective } from '../directives/for-of/for_of.directive';
import { CancelableBrowserEventArgs } from '../core/utils';
import { IgxComboBase, IGX_COMBO_COMPONENT } from './combo.common';
import { Navigate } from '../drop-down/drop-down.common';
import { IDropDownBase, IGX_DROPDOWN_BASE } from '../drop-down/drop-down.common';
import { IgxDropDownComponent } from '../drop-down/drop-down.component';
import { DropDownActionKey } from '../drop-down/drop-down.common';
import { IgxComboAddItemComponent } from './combo-add-item.component';
import { IgxComboAPIService } from './combo.api';
import { IgxDropDownItemBase } from '../drop-down/drop-down-item.base';
import { IgxSelectionAPIService } from '../core/selection';
import { IgxComboItemComponent } from './combo-item.component';

/** @hidden */
@Component({
    selector: 'igx-combo-drop-down',
    templateUrl: '../drop-down/drop-down.component.html',
    providers: [{ provide: IGX_DROPDOWN_BASE, useExisting: IgxComboDropDownComponent }]
})
export class IgxComboDropDownComponent extends IgxDropDownComponent implements IDropDownBase, OnDestroy, AfterViewInit {
    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selection: IgxSelectionAPIService,
        @Inject(IGX_COMBO_COMPONENT) public combo: IgxComboBase,
        protected comboAPI: IgxComboAPIService) {
        super(elementRef, cdr, selection);
    }

    protected get scrollContainer() {
        return this.virtDir.dc.location.nativeElement;
    }

    protected get isScrolledToLast(): boolean {
        const scrollTop = this.virtDir.getVerticalScroll().scrollTop;
        const scrollHeight = this.virtDir.getVerticalScroll().scrollHeight;
        return Math.floor(scrollTop + this.virtDir.igxForContainerSize) === scrollHeight;
    }

    protected get lastVisibleIndex(): number {
        return this.combo.totalItemCount ?
            Math.floor(this.combo.itemsMaxHeight / this.combo.itemHeight) :
            this.items.length - 1;
    }

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxComboItemComponent, { descendants: true })
    public children: QueryList<IgxDropDownItemBase> = null;

    /**
     * @hidden @internal
     */
    public onFocus() {
        this._focusedItemIndex = this._focusedItemIndex !== -1 ? this._focusedItemIndex : this.items[0].index;
    }

    /**
     * @hidden @internal
     */
    public onBlur(evt?) {
        this._focusedItemIndex = -1;
    }

    /**
     * @hidden @internal
     */
    public onToggleOpened() {
        this.onOpened.emit();
    }

    /**
     * @hidden
     */
    public navigatePrev() {
        if (this._focusedItemIndex === 0 && this.virtDir.state.startIndex === 0) {
            this.combo.focusSearchInput(false);
        } else {
            super.navigatePrev();
        }
    }


    /**
     * @hidden
     */
    public navigateNext() {
        if (this._focusedItemIndex === this.virtDir.igxForOf.length - 1) {
            this.focusAddItemButton();
        } else {
            super.navigateNext();
        }
    }

    /**
     * @hidden @internal
     */
    public selectItem(item: IgxDropDownItemBase) {
        if (item === null || item === undefined) {
            return;
        }
        this.comboAPI.set_selected_item(item.itemID);
        this._focusedItem = item;
    }

    private focusAddItemButton() {
        if (this.combo.isAddButtonVisible()) {
            this.focusedItem = this.items[this.items.length - 1];
        }
    }

    protected scrollToHiddenItem(newItem: any): void { }

    protected scrollHandler = () => {
        this.comboAPI.disableTransitions = true;
    }

    protected get sortedChildren(): IgxDropDownItemBase[] {
        if (this.children !== undefined) {
            return this.children.toArray()
                .sort((a: IgxDropDownItemBase, b: IgxDropDownItemBase) => {
                    return a.index - b.index;
                });
        }
        return null;
    }

    /**
     * Get all non-header items
     *
     * ```typescript
     * let myDropDownItems = this.dropdown.items;
     * ```
     */
    public get items(): IgxComboItemComponent[] {
        const items: IgxComboItemComponent[] = [];
        if (this.children !== undefined) {
            const sortedChildren = this.sortedChildren as IgxComboItemComponent[];
            for (const child of sortedChildren) {
                if (!child.isHeader) {
                    items.push(child);
                }
            }
        }

        return items;
    }

    protected scrollToItem() {
    }
    /**
     * @hidden @internal
     */
    onToggleClosing(e: CancelableBrowserEventArgs) {
        super.onToggleClosing(e);
        this._scrollPosition = this.virtDir.getVerticalScroll().scrollTop;
    }

    /**
     * @hidden @internal
     */
    public onItemActionKey(key: DropDownActionKey) {
        switch (key) {
            case DropDownActionKey.ENTER:
                this.handleEnter();
                break;
            case DropDownActionKey.SPACE:
                this.handleSpace();
                break;
            case DropDownActionKey.ESCAPE:
                this.close();
        }
    }

    private handleEnter() {
        if (this.isAddItemFocused()) {
            this.combo.addItemToCollection();
        } else {
            this.close();
        }
    }

    private handleSpace() {
        if (this.isAddItemFocused()) {
            return;
        } else {
            this.selectItem(this.focusedItem);
        }
    }

    private isAddItemFocused(): boolean {
        return this.focusedItem instanceof IgxComboAddItemComponent;
    }

    public ngAfterViewInit() {
        this.virtDir.getVerticalScroll().addEventListener('scroll', this.scrollHandler);
    }

    /**
     *@hidden @internal
     */
    public ngOnDestroy(): void {
        this.virtDir.getVerticalScroll().removeEventListener('scroll', this.scrollHandler);
        this.destroy$.next(true);
        this.destroy$.complete();
    }
}
